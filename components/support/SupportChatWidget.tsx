"use client";

import { useState, useEffect, useRef } from "react";
import { TIME_SLOTS } from "@/lib/timeSlots";
import { FAQ_ITEMS, searchFaqByKeyword } from "@/config/faq";

// 取得今天的日期字串（YYYY-MM-DD）
function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`; // 例如 2025-12-04
}

type ChatRole = "bot" | "user";

type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
};

type ChatStep =
  | "askIntent"
  | "bookingAskDate"
  | "bookingAskTime"
  | "bookingAskPeople"
  | "bookingAskName"
  | "bookingAskPhone"
  | "bookingAskNote"
  | "bookingConfirm"
  | "faq"
  | "faqSelectSubQuestion" // 新增：正在讓使用者選子題
  | "idle";

type BookingFormState = {
  date?: string;        // "2025-12-04"
  timeSlotId?: string;  // SLOT_ID，例如 "MORNING_1"
  peopleCount?: number;
  name?: string;
  phone?: string;
  note?: string;
};

type SupportTemplate = {
  id: string;
  title: string;
  prompt: string;
  reply: string;
  tags: string[];
  isActive: boolean;
};

type TemplateGroup = {
  title: string;
  items: SupportTemplate[];
};

export function SupportChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [step, setStep] = useState<ChatStep>("askIntent");
  const [inputText, setInputText] = useState("");
  const [bookingForm, setBookingForm] = useState<BookingFormState>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [templates, setTemplates] = useState<SupportTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [templateGroups, setTemplateGroups] = useState<TemplateGroup[]>([]);
  const [pendingTemplateGroup, setPendingTemplateGroup] = useState<TemplateGroup | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 封裝一個 logMessage helper
  async function logMessage(role: "USER" | "BOT", content: string) {
    // 前端永遠先更新 UI，不因為 log 失敗而阻塞對話

    if (!sessionId) {
      console.warn("[SupportChatWidget] sessionId 不存在，暫時無法寫入 ChatMessage", {
        role,
        content,
      });
      return;
    }

    try {
      const res = await fetch(
        `/api/support/chat-sessions/${encodeURIComponent(sessionId)}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role, content }),
        }
      );

      if (!res.ok) {
        console.error(
          "[SupportChatWidget] logMessage failed:",
          res.status,
          await res.text()
        );
      } else {
        const data = await res.json();
        if (!data?.success) {
          console.error(
            "[SupportChatWidget] logMessage response not successful:",
            data
          );
        }
      }
    } catch (error) {
      console.error("[SupportChatWidget] logMessage error:", error);
    }
  }

  // 工具函式：新增訊息
  const appendMessage = (message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);

    // 將訊息寫入後端（只在有 sessionId 時執行）
    if (message.role === "user") {
      logMessage("USER", message.text);
    } else if (message.role === "bot") {
      logMessage("BOT", message.text);
    }
  };

  // 當視窗開啟時，如果沒有訊息，顯示初始歡迎訊息
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: "welcome",
        role: "bot",
        text: "您好～我是微光暖食的 AI 客服。\n\n可以幫您：\n1. 說明營業時間、店址與預約規則\n2. 協助安排早午餐預約\n\n請問你是想「預約用餐」，還是先「詢問其他問題」呢？",
      };
      appendMessage(welcomeMessage);
      setStep("askIntent");
    }
  }, [isOpen, messages.length]);

  // 自動滾動到最新訊息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 建立聊天 session（元件初次掛載時）
  useEffect(() => {
    let cancelled = false;

    const createSession = async () => {
      try {
        setIsCreatingSession(true);
        setSessionError(null);

        const res = await fetch("/api/support/chat-sessions", {
          method: "POST",
        });

        if (!res.ok) {
          console.error("[SupportChatWidget] create session failed:", res.status);
          setSessionError(`建立對話失敗（${res.status}）`);
          return;
        }

        const data = await res.json();

        if (!cancelled) {
          if (data?.success && typeof data.sessionId === "string") {
            setSessionId(data.sessionId);
          } else {
            console.error("[SupportChatWidget] invalid create session response:", data);
            setSessionError("建立對話失敗（回傳格式錯誤）");
          }
        }
      } catch (err) {
        console.error("[SupportChatWidget] create session error:", err);
        if (!cancelled) {
          setSessionError("建立對話失敗（網路錯誤）");
        }
      } finally {
        if (!cancelled) {
          setIsCreatingSession(false);
        }
      }
    };

    // 只在第一次載入時嘗試建立一個 session
    createSession();

    return () => {
      cancelled = true;
    };
  }, []);

  // 載入啟用中的 SupportTemplate
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setIsLoadingTemplates(true);
        const res = await fetch("/api/support/templates");
        if (!res.ok) {
          console.error("fetch support templates failed", await res.text());
          return;
        }
        const data = await res.json();
        const items: SupportTemplate[] = (data.templates ?? []).filter(
          (t: SupportTemplate) => t.isActive
        );

        // 原本的 templates 若還有在用可以保留：
        setTemplates(items);

        // 依 title 分組
        const map = new Map<string, SupportTemplate[]>();
        for (const t of items) {
          const list = map.get(t.title) ?? [];
          list.push(t);
          map.set(t.title, list);
        }
        const groups: TemplateGroup[] = Array.from(map.entries()).map(
          ([title, groupItems]) => ({
            title,
            items: groupItems,
          })
        );
        setTemplateGroups(groups);
      } catch (error) {
        console.error("fetch support templates error", error);
      } finally {
        setIsLoadingTemplates(false);
      }
    };

    fetchTemplates();
  }, []);

  // 將日期和時段轉換為 ISO 字串
  function toIsoFromDateAndSlot(date: string, slotId: string) {
    const slot = TIME_SLOTS.find((s) => s.id === slotId);
    if (!slot) {
      throw new Error("Invalid time slot");
    }
    const start = new Date(`${date}T${slot.start}`);
    const end = new Date(`${date}T${slot.end}`);
    return {
      reservedStart: start.toISOString(),
      reservedEnd: end.toISOString(),
    };
  }

  // 處理日期格式轉換（支援 YYYY/MM/DD 轉成 YYYY-MM-DD）
  function normalizeDate(dateStr: string): string | null {
    const trimmed = dateStr.trim();
    // 如果包含斜線，替換為橫線
    const normalized = trimmed.replace(/\//g, "-");
    // 簡單驗證格式（YYYY-MM-DD）
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (datePattern.test(normalized)) {
      return normalized;
    }
    return null;
  }

  // 處理使用者輸入
  const handleUserInput = async (inputText: string) => {
    const trimmedInput = inputText.trim();
    if (!trimmedInput) return;

    // 1. 新增使用者訊息
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmedInput,
    };
    appendMessage(userMessage);

    // 2. 根據當前 step 處理
    await processStep(trimmedInput);
  };

  // 處理各個步驟
  const processStep = async (userInput: string) => {
    let botMessage: ChatMessage;
    let nextStep: ChatStep = step;

    // 處理子選單選擇（改為按鈕版，不再處理數字輸入）
    if (step === "faqSelectSubQuestion" && pendingTemplateGroup) {
      // 如果使用者在子選單模式下輸入文字，提示使用按鈕
      botMessage = {
        id: `bot-${Date.now()}`,
        role: "bot",
        text: "您可以直接點上方的按鈕來選擇想了解的項目喔～",
      };
      appendMessage(botMessage);
      return;
    }

    // FAQ 模式處理（優先於其他步驟）
    if (step === "faq") {
      const keyword = userInput.trim();
      if (!keyword) {
        botMessage = {
          id: `bot-${Date.now()}`,
          role: "bot",
          text:
            "可以告訴我您想了解什麼嗎？例如：營業時間、用餐時間、預約規則、取消方式⋯⋯",
        };
        appendMessage(botMessage);
        return;
      }

      const lower = keyword.toLowerCase();
      // 防呆：如果使用者輸入看起來是想預約
      if (lower.includes("預約") || lower.includes("訂位") || lower.includes("訂桌")) {
        botMessage = {
          id: `bot-${Date.now()}`,
          role: "bot",
          text:
            "聽起來您可能是想直接預約用餐～\n" +
            "如果方便，我可以帶您走一個簡單的預約流程，幫您安排今天的時段。\n" +
            "如果要開始預約，請輸入「我要預約」，或按下下方的「我要預約」按鈕。",
        };
        appendMessage(botMessage);
        return;
      }

      // 1) 先在 SupportTemplate 中找
      const matchFromTemplates = templates
        .map((tpl) => {
          const haystack =
            (tpl.title + " " + tpl.prompt + " " + (tpl.tags ?? []).join(" "))
              .toLowerCase();
          const hit = haystack.includes(lower);
          return { tpl, hit };
        })
        .filter((x) => x.hit)
        .map((x) => x.tpl);

      if (matchFromTemplates.length > 0) {
        const tpl = matchFromTemplates[0];

        botMessage = {
          id: `bot-${Date.now()}`,
          role: "bot",
          text:
            `關於「${tpl.title}」，目前的說明如下：\n\n` +
            tpl.reply,
        };
        appendMessage(botMessage);
        return;
      }

      // 2) 若 SupportTemplate 中沒有，改用內建 FAQ
      const faqResults = searchFaqByKeyword(keyword);
      if (faqResults && faqResults.length > 0) {
        const top = faqResults[0];
        botMessage = {
          id: `bot-${Date.now()}`,
          role: "bot",
          text:
            `我在常見問題裡找到這個回答：\n\n` +
            `Q：${top.question}\n` +
            `A：${top.answer}`,
        };
        appendMessage(botMessage);
        return;
      }

      // 3) 兩邊都沒有：先回一段客氣的話
      botMessage = {
        id: `bot-${Date.now()}`,
        role: "bot",
        text:
          "這個問題目前不在我的資料庫裡 QQ\n" +
          "您可以換一個說法再問一次，或是直接使用預約服務；如果是比較特別的情況，也可以之後請店內人員再跟您聯絡。",
      };
      appendMessage(botMessage);
      return;
    }

    switch (step) {
      case "askIntent":
        if (userInput.includes("預約") || userInput.includes("我要預約")) {
          // 開始預約流程，直接使用今天日期
          const today = getTodayDateString();
          setBookingForm({
            date: today,
          });
          nextStep = "bookingAskTime";
          botMessage = {
            id: `bot-${Date.now()}`,
            role: "bot",
            text: `好的～目前先幫您以「今天」 ${today} 為預約日期。\n下方是今天可預約的早午餐時段，請點選您想要的時段。\n\n（若想預約其他日期，目前麻煩您改用預約表單喔 🙏）`,
          };
        } else {
          // 其他問題，轉到 FAQ 模式
          setStep("faq");
          setPendingTemplateGroup(null);
          botMessage = {
            id: `bot-${Date.now()}`,
            role: "bot",
            text:
              "沒問題～您可以直接點下面的常見問題按鈕，或自己輸入想問的內容，例如：營業時間、用餐時間限制、預約規則、取消方式等。",
          };
          nextStep = "faq";
        }
        break;

      case "bookingAskDate":
        const normalizedDate = normalizeDate(userInput);
        if (!normalizedDate) {
          botMessage = {
            id: `bot-${Date.now()}`,
            role: "bot",
            text: "日期格式似乎不對，請輸入 YYYY-MM-DD 格式，例如：2025-12-04",
          };
          appendMessage(botMessage);
          return; // 不改變 step
        }
        setBookingForm((prev) => ({ ...prev, date: normalizedDate }));
        nextStep = "bookingAskTime";
        const timeSlotOptions = TIME_SLOTS.map(
          (slot, idx) => `${idx + 1}. ${slot.label}`
        ).join("\n");
        botMessage = {
          id: `bot-${Date.now()}`,
          role: "bot",
          text: `收到，預約日期是 ${normalizedDate}。請問想要哪一個用餐時段呢？\n\n可選時段：\n${timeSlotOptions}\n\n請輸入編號（1-4）或時段名稱。`,
        };
        break;

      case "bookingAskTime":
        // 解析用戶輸入：編號或時段名稱
        let selectedSlotId: string | undefined;
        const inputNum = parseInt(userInput, 10);
        if (!isNaN(inputNum) && inputNum >= 1 && inputNum <= TIME_SLOTS.length) {
          selectedSlotId = TIME_SLOTS[inputNum - 1].id;
        } else {
          // 嘗試從 label 匹配（包含字串匹配）
          const matchedSlot = TIME_SLOTS.find((slot) =>
            slot.label.includes(userInput) || userInput.includes(slot.label)
          );
          if (matchedSlot) {
            selectedSlotId = matchedSlot.id;
          }
        }

        if (!selectedSlotId) {
          botMessage = {
            id: `bot-${Date.now()}`,
            role: "bot",
            text: "抱歉，我沒看懂您選擇的時段。請輸入編號（1-4）或時段名稱，例如「09:00–10:30」。",
          };
          appendMessage(botMessage);
          return; // 不改變 step
        }

        const selectedSlot = TIME_SLOTS.find((s) => s.id === selectedSlotId);
        setBookingForm((prev) => ({ ...prev, timeSlotId: selectedSlotId }));
        nextStep = "bookingAskPeople";
        botMessage = {
          id: `bot-${Date.now()}`,
          role: "bot",
          text: `好的，已為您選擇 ${selectedSlot?.label}。請問預計幾位用餐呢？`,
        };
        break;

      case "bookingAskPeople":
        const peopleCount = parseInt(userInput, 10);
        if (isNaN(peopleCount) || peopleCount < 1) {
          botMessage = {
            id: `bot-${Date.now()}`,
            role: "bot",
            text: "人數看起來怪怪的，可以再輸入一次嗎？請輸入正整數，例如：2",
          };
          appendMessage(botMessage);
          return; // 不改變 step
        }
        setBookingForm((prev) => ({ ...prev, peopleCount }));
        nextStep = "bookingAskName";
        botMessage = {
          id: `bot-${Date.now()}`,
          role: "bot",
          text: `了解，預計 ${peopleCount} 位。請問貴姓？（請輸入姓名）`,
        };
        break;

      case "bookingAskName":
        setBookingForm((prev) => ({ ...prev, name: userInput.trim() }));
        nextStep = "bookingAskPhone";
        botMessage = {
          id: `bot-${Date.now()}`,
          role: "bot",
          text: "好的，聯絡電話方便提供嗎？",
        };
        break;

      case "bookingAskPhone":
        setBookingForm((prev) => ({ ...prev, phone: userInput.trim() }));
        nextStep = "bookingAskNote";
        botMessage = {
          id: `bot-${Date.now()}`,
          role: "bot",
          text: "如果有任何特殊需求（例如靠窗、嬰兒座椅、慶生服務等），可以在這裡說明；若沒有也可以直接回覆「無」。",
        };
        break;

      case "bookingAskNote":
        const note = userInput.trim() === "無" || userInput.trim() === "" 
          ? undefined 
          : userInput.trim();
        setBookingForm((prev) => ({ ...prev, note }));
        nextStep = "bookingConfirm";
        
        // 組 recap 文案
        const slotLabel = TIME_SLOTS.find((s) => s.id === bookingForm.timeSlotId)?.label || "";
        const recapText = `幫您確認一下預約資料：\n\n日期：${bookingForm.date}\n時段：${slotLabel}\n人數：${bookingForm.peopleCount} 位\n姓名：${bookingForm.name}\n電話：${bookingForm.phone}\n特殊需求：${note || "無"}\n\n若以上資訊都正確，請輸入「確認預約」，若要重填請輸入「重新填寫」。`;
        
        botMessage = {
          id: `bot-${Date.now()}`,
          role: "bot",
          text: recapText,
        };
        break;

      case "bookingConfirm":
        if (userInput.includes("重新") || userInput.includes("重填")) {
          // 重新開始，直接使用今天日期
          const today = getTodayDateString();
          setBookingForm({
            date: today,
          });
          nextStep = "bookingAskTime";
          botMessage = {
            id: `bot-${Date.now()}`,
            role: "bot",
            text: `了解，讓我們重新開始。目前先幫您以「今天」 ${today} 為預約日期。\n下方是今天可預約的早午餐時段，請點選您想要的時段。\n\n（若想預約其他日期，目前麻煩您改用預約表單喔 🙏）`,
          };
        } else if (userInput.includes("確認")) {
          // 呼叫 API 建立預約
          await submitBooking();
          return; // submitBooking 會自己處理訊息
        } else {
          botMessage = {
            id: `bot-${Date.now()}`,
            role: "bot",
            text: "如果要送出預約請輸入「確認預約」，若要修改請輸入「重新填寫」。",
          };
          appendMessage(botMessage);
          return;
        }
        break;

      case "idle":
        // 一般問題處理
        botMessage = {
          id: `bot-${Date.now()}`,
          role: "bot",
          text: "目前我還在學習中，關於詳細 FAQ 和店內規則，之後會再提供更完整的回覆 🙏\n\n如果這個問題很重要，也歡迎留下聯絡方式，我們會由人工客服回覆您。",
        };
        break;

      default:
        botMessage = {
          id: `bot-${Date.now()}`,
          role: "bot",
          text: "目前我還在訓練中，先請您簡單描述想知道的內容，我會盡量協助 🙏",
        };
    }

    appendMessage(botMessage);
    setStep(nextStep);
  };

  // 提交預約
  const submitBooking = async () => {
    if (!bookingForm.date || !bookingForm.timeSlotId || !bookingForm.peopleCount || !bookingForm.name || !bookingForm.phone) {
      const errorMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: "bot",
        text: "抱歉，預約資訊不完整，無法建立預約。請重新開始預約流程。",
      };
      appendMessage(errorMessage);
      return;
    }

    setIsSubmitting(true);

    // 顯示處理中訊息
    const loadingMessage: ChatMessage = {
      id: `bot-${Date.now()}`,
      role: "bot",
      text: "幫您處理中，請稍候…",
    };
    appendMessage(loadingMessage);

    try {
      // 1. 根據 date + timeSlotId 算出 reservedStart / reservedEnd
      const { reservedStart, reservedEnd } = toIsoFromDateAndSlot(
        bookingForm.date,
        bookingForm.timeSlotId
      );

      // 2. 呼叫 API
      const response = await fetch("/api/reservations/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: bookingForm.name,
          phone: bookingForm.phone,
          peopleCount: bookingForm.peopleCount,
          reservedStart,
          reservedEnd,
          notes: bookingForm.note ? `[AI 客服預約] ${bookingForm.note}` : "[AI 客服預約]",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create reservation");
      }

      const data = await response.json();

      // 成功訊息
      const selectedSlot = TIME_SLOTS.find((s) => s.id === bookingForm.timeSlotId);
      let successText = `預約成功 🎉\n\n- 預約編號：${data.reservation?.id || "N/A"}\n- 日期：${bookingForm.date}\n- 時段：${selectedSlot?.label || ""}\n- 人數：${bookingForm.peopleCount} 人\n- 姓名：${bookingForm.name}\n\n之後若要修改或取消，請再聯絡我們。`;

      if (data.calendarEvent?.htmlLink) {
        successText += `\n\n這是您的行事曆連結：${data.calendarEvent.htmlLink}`;
      }

      const successMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: "bot",
        text: successText,
      };
      appendMessage(successMessage);

      // 清空表單，回到初始狀態
      setBookingForm({});
      setStep("idle");
    } catch (error) {
      console.error("AI chat booking error", error);
      const errorMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: "bot",
        text: "系統目前有點忙碌，暫時無法直接幫您建立預約 🙏\n\n建議您改用預約表單（下方按鈕），或稍後再試一次。",
      };
      appendMessage(errorMessage);

      // 提供預約表單按鈕（在訊息下方顯示）
      // 這裡我們可以在 UI 中顯示一個按鈕，但由於訊息已經送出，我們可以在下一個訊息中加入提示
      const helpMessage: ChatMessage = {
        id: `bot-${Date.now()}-help`,
        role: "bot",
        text: "您也可以點擊這裡前往預約表單：",
      };
      appendMessage(helpMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 處理選擇時段
  const handleSelectTimeSlot = (slotId: string) => {
    const slot = TIME_SLOTS.find((s) => s.id === slotId);
    if (!slot) return;

    setBookingForm((prev) => ({
      ...prev,
      timeSlotId: slot.id,
    }));

    // 使用者選擇時段，視為 user 訊息
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: `選擇時段：${slot.label}`,
    };
    appendMessage(userMessage);

    // Bot 問下一步：人數
    const botMessage: ChatMessage = {
      id: `bot-${Date.now()}`,
      role: "bot",
      text: "好的，請問預計幾位用餐呢？",
    };
    appendMessage(botMessage);

    setStep("bookingAskPeople");
  };

  // 處理點擊常見問題按鈕（改用群組）
  const handleClickTemplateGroup = (group: TemplateGroup) => {
    appendMessage({
      id: `user-${Date.now()}`,
      role: "user",
      text: `想了解：${group.title}`,
    });

    if (group.items.length === 1) {
      // 只有一個模板，直接回答
      const tpl = group.items[0];
      appendMessage({
        id: `bot-${Date.now()}`,
        role: "bot",
        text: tpl.reply,
      });
      setPendingTemplateGroup(null);
      setStep("faq");
      return;
    }

    // 有多個子項目 → 出子選單（按鈕版）
    setPendingTemplateGroup(group);

    const optionsText = group.items
      .map((tpl) => {
        // 子項目顯示用文字：使用 prompt 的第一段（逗號或頓號前面）
        const label =
          tpl.prompt?.split(/[，,]/)[0]?.trim() || tpl.title || "這個問題";
        return `・${label}`;
      })
      .join("\n");

    appendMessage({
      id: `bot-${Date.now()}`,
      role: "bot",
      text:
        `關於「${group.title}」，您想了解哪一個部分呢？\n\n` +
        optionsText +
        `\n\n您可以直接點下面的按鈕來選擇喔。`,
    });

    setStep("faqSelectSubQuestion");
  };

  // 處理選擇子問題（按鈕點擊）
  const handleSelectSubQuestion = (tpl: SupportTemplate) => {
    // 使用者點了子選項
    const shortLabel =
      tpl.prompt?.split(/[，,]/)[0]?.trim() || tpl.title || "這個問題";

    appendMessage({
      id: `user-${Date.now()}`,
      role: "user",
      text: `想了解：${shortLabel}`,
    });

    appendMessage({
      id: `bot-${Date.now()}`,
      role: "bot",
      text: tpl.reply,
    });

    setPendingTemplateGroup(null);
    setStep("faq");
  };

  // 切換到問題模式
  const handleSwitchToQuestionMode = () => {
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: "我想先詢問問題",
    };
    appendMessage(userMessage);

    const botMessage: ChatMessage = {
      id: `bot-${Date.now()}`,
      role: "bot",
      text:
        "好的，我們先來聊聊～您可以點選下方的常見問題，或直接輸入想問的內容。",
    };
    appendMessage(botMessage);

    setStep("faq");
    setPendingTemplateGroup(null);
  };

  // 判斷是否為預約流程
  const isBookingStep = step.startsWith("booking");

  // 切換到 FAQ 模式（從預約流程切換回來）
  const handleSwitchToFaq = () => {
    appendMessage({
      id: `user-${Date.now()}`,
      role: "user",
      text: "我想先問一些問題",
    });

    appendMessage({
      id: `bot-${Date.now()}`,
      role: "bot",
      text:
        "沒問題～您可以點下面的常見問題按鈕，或直接輸入想了解的內容，例如：營業時間、用餐時間限制、預約規則、取消方式⋯⋯",
    });

    setPendingTemplateGroup(null);
    setStep("faq");
  };

  // 前往預約表單（新視窗）
  const handleGoToReservationForm = () => {
    window.open("/reservation", "_blank");
  };

  // 前往預約頁面（當前視窗）
  const handleGoToReservationPage = () => {
    // 最簡單版先用 window.location，避免引入 router
    if (typeof window !== "undefined") {
      window.location.href = "/reservation";
    }
  };

  // 快速按鈕處理
  const handleQuickButton = (action: "booking" | "question") => {
    if (action === "booking") {
      const today = getTodayDateString();

      setBookingForm({
        date: today,
      });

      // 新增 user 訊息
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        text: "我要預約",
      };
      appendMessage(userMessage);

      // 新增 bot 訊息
      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: "bot",
        text: `好的～目前先幫您以「今天」 ${today} 為預約日期。\n下方是今天可預約的早午餐時段，請點選您想要的時段。\n\n（若想預約其他日期，目前麻煩您改用預約表單喔 🙏）`,
      };
      appendMessage(botMessage);

      // 下一步直接進入「選擇時段」
      setStep("bookingAskTime");
    } else {
      // 先問問題
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        text: "先問問題",
      };
      appendMessage(userMessage);

      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: "bot",
        text:
          "好的，我們先來聊聊～您可以點選下方的常見問題，或直接輸入想問的內容。",
      };
      appendMessage(botMessage);
      setStep("faq");
      setPendingTemplateGroup(null);
    }
  };

  const handleSendMessage = () => {
    if (!inputText.trim() || isSubmitting) return;
    const text = inputText;
    setInputText("");
    handleUserInput(text);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* 飄浮按鈕 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white font-semibold px-6 py-3 rounded-full shadow-warm flex items-center gap-2 transition-all transform hover:scale-105"
        aria-label="開啟客服聊天"
      >
        <span className="text-xl">💬</span>
        <span>客服</span>
      </button>

      {/* 聊天視窗 */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[calc(100vw-3rem)] h-[480px] bg-white rounded-2xl shadow-warm flex flex-col overflow-hidden md:w-[360px] md:h-[480px] max-h-[calc(100vh-8rem)]">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-400 to-orange-500 text-white p-4 flex justify-between items-center gap-2">
            <div className="flex flex-col">
              <span className="font-semibold text-lg">微光暖食客服</span>
            </div>

            {/* 主切換按鈕：問問題 ↔ 預約 */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={isBookingStep ? handleSwitchToFaq : handleGoToReservationPage}
                className="px-3 py-1 rounded-full bg-white text-xs font-semibold text-orange-600 hover:bg-orange-50 transition-colors"
              >
                {isBookingStep ? "詢問問題" : "我要預約"}
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white transition-colors"
                aria-label="關閉客服"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Body - 訊息列表 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    message.role === "user"
                      ? "bg-gradient-to-r from-orange-400 to-orange-500 text-white"
                      : "bg-white text-gray-800 border border-gray-200"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                </div>
              </div>
            ))}

            {/* 快速按鈕（只在 askIntent 時顯示） */}
            {step === "askIntent" && messages.length > 0 && (
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleQuickButton("booking")}
                  className="px-4 py-2 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-full text-sm font-medium hover:from-orange-500 hover:to-orange-600 transition-all"
                >
                  我要預約
                </button>
                <button
                  onClick={() => handleQuickButton("question")}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-300 transition-all"
                >
                  先問問題
                </button>
              </div>
            )}

            {/* 時段選擇按鈕（在 bookingAskTime 且未選擇時顯示） */}
            {step === "bookingAskTime" && !bookingForm.timeSlotId && (
              <div className="mt-2 flex flex-wrap gap-2">
                {TIME_SLOTS.map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => handleSelectTimeSlot(slot.id)}
                    className="px-3 py-1 rounded-full border border-orange-400 text-sm text-orange-700 bg-white hover:bg-orange-50 transition-all"
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
            )}

            {/* 預約表單連結（在錯誤訊息後顯示） */}
            {messages.some((m) => m.text.includes("改用預約表單") || m.text.includes("您也可以點擊這裡前往預約表單")) && (
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={handleGoToReservationForm}
                  className="px-4 py-2 rounded-full bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-all"
                >
                  前往預約表單
                </button>
                <button
                  type="button"
                  onClick={handleSwitchToQuestionMode}
                  className="px-4 py-2 rounded-full border border-orange-400 text-orange-600 text-sm font-medium bg-white hover:bg-orange-50 transition-all"
                >
                  我要先詢問
                </button>
              </div>
            )}

            {/* 常見問題按鈕列 */}
            {(step === "askIntent" || step === "faq" || step === "faqSelectSubQuestion") && (
              <div className="mt-2">
                {templateGroups.length > 0 && (
                  <div className="mb-1 text-xs text-gray-600">
                    常見問題：
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {templateGroups.slice(0, 6).map((group) => (
                    <button
                      key={group.title}
                      type="button"
                      onClick={() => handleClickTemplateGroup(group)}
                      className="px-3 py-1 rounded-full border border-orange-300 bg-white text-xs text-orange-700 hover:bg-orange-50 transition-all"
                    >
                      {group.title}
                    </button>
                  ))}
                  {templateGroups.length === 0 && !isLoadingTemplates && (
                    <span className="text-xs text-gray-500">
                      （目前尚未設定常用問答，可在後台「客服機器人」頁面新增）
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* 子問題按鈕區塊（當有 pendingTemplateGroup 且 step 為 faqSelectSubQuestion 時顯示） */}
            {step === "faqSelectSubQuestion" && pendingTemplateGroup && (
              <div className="mt-3 rounded-2xl bg-orange-50 border border-orange-100 p-3">
                <p className="text-sm text-gray-800 mb-2">
                  請問您想了解哪一個部分呢？
                </p>
                <div className="flex flex-col gap-2">
                  {pendingTemplateGroup.items.map((tpl) => {
                    const label =
                      tpl.prompt?.split(/[，,]/)[0]?.trim() ||
                      tpl.title ||
                      "這個問題";
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => handleSelectSubQuestion(tpl)}
                        className="w-full text-left px-3 py-2 rounded-xl bg-white border border-orange-200 text-sm text-orange-800 hover:bg-orange-100 transition-colors"
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer - 輸入區 */}
          <div className="border-t border-gray-200 p-4 bg-white">
            <div className="flex gap-2">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="輸入訊息..."
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                rows={2}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim() || isSubmitting}
                className="px-6 py-2 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-xl font-medium hover:from-orange-500 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "處理中..." : "送出"}
              </button>
            </div>
            {/* Debug: Session 狀態顯示（開發模式） */}
            {process.env.NODE_ENV === "development" && (
              <div className="text-xs text-gray-400 mt-1">
                {sessionError
                  ? `⚠️ Chat session error: ${sessionError}`
                  : sessionId
                  ? `Session: ${sessionId.slice(0, 8)}...`
                  : isCreatingSession
                  ? "建立對話中…"
                  : "尚未建立對話"}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
