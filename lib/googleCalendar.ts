import { google } from "googleapis";

/**
 * 取得 Google Calendar 客戶端
 * 
 * 【SaaS Ready 擴充點】
 * 目前：使用單一環境變數 GOOGLE_CALENDAR_ID
 * 未來：可擴充為支援多分店，根據 branchId 動態選擇 calendarId
 * 
 * 擴充範例：
 * - 可從資料庫查詢 branch.calendarId
 * - 或使用 branchId -> calendarId 的映射表
 * - 或使用環境變數 GOOGLE_CALENDAR_ID_{BRANCH_ID}
 * 
 * @param branchId - 可選的分店 ID（未來擴充用）
 * @returns { calendar, calendarId } 或 null
 */
export function getCalendarClient(branchId?: string) {
  // =======================================================================
  // 【1】從 Vercel 讀取環境變數（可能包含引號的單行字串）
  // =======================================================================
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKeyString = process.env.GOOGLE_PRIVATE_KEY;
  
  // =======================================================================
  // 【SaaS Ready】分店 calendarId 擴充點
  // =======================================================================
  // 目前：使用單一環境變數
  // 未來擴充方向：
  //   1. 若 branchId 存在，從資料庫查詢 branch.calendarId
  //   2. 或使用環境變數映射：GOOGLE_CALENDAR_ID_{branchId}
  //   3. 或使用配置檔案：branches[branchId].calendarId
  // =======================================================================
  let calendarId = process.env.GOOGLE_CALENDAR_ID;
  
  // TODO: 未來擴充 - 根據 branchId 動態取得 calendarId
  // if (branchId) {
  //   calendarId = await getBranchCalendarId(branchId);
  //   // 或
  //   calendarId = process.env[`GOOGLE_CALENDAR_ID_${branchId}`];
  // }

  if (!clientEmail || !rawKeyString || !calendarId) {
    console.error("❌ 缺少 Google Calendar 必要環境變數", {
      hasEmail: !!clientEmail,
      hasPrivateKey: !!rawKeyString,
      hasCalendarId: !!calendarId,
    });
    return null;
  }

  // =======================================================================
  // 【2】移除字串兩側可能存在的引號，並確保不是 undefined
  // =======================================================================
  let cleanKeyString = rawKeyString;

  if (rawKeyString && rawKeyString.startsWith('"') && rawKeyString.endsWith('"')) {
    // 移除外部雙引號，留下內部的轉義字串
    cleanKeyString = rawKeyString.slice(1, -1);
    console.log("🔧 已移除 PRIVATE_KEY 外部引號");
  }

  // =======================================================================
  // 【DEBUG】檢查 PRIVATE_KEY 前 30 字元（可上正式線）
  // =======================================================================
  console.log("🔑 PRIVATE_KEY 前 30 字元：", cleanKeyString.substring(0, 30));
  console.log("🔑 PRIVATE_KEY 長度：", cleanKeyString.length);

  // =======================================================================
  // 【3】核心：將字串轉為 Google 服務帳戶函式庫需要的格式
  // =======================================================================
  // Google 函式庫（googleapis）需要 PEM 格式的金鑰字串
  // 處理多種可能的格式問題：
  // 1. 將 \n 轉義字元轉換為實際換行
  // 2. 確保 BEGIN/END 標記後有正確的換行
  // =======================================================================
  let fixedKey: string;

  try {
    fixedKey = cleanKeyString
      .replace(/\\n/g, "\n")
      .replace(/-----BEGIN PRIVATE KEY-----/, "-----BEGIN PRIVATE KEY-----\n")
      .replace(/-----END PRIVATE KEY-----/, "\n-----END PRIVATE KEY-----");

    // 驗證金鑰格式
    if (!fixedKey.includes("-----BEGIN PRIVATE KEY-----")) {
      console.warn("⚠️ PRIVATE_KEY 格式可能不正確，未找到 BEGIN 標記");
    }
    if (!fixedKey.includes("-----END PRIVATE KEY-----")) {
      console.warn("⚠️ PRIVATE_KEY 格式可能不正確，未找到 END 標記");
    }
  } catch (e) {
    console.error("❌ 無法解析服務帳戶金鑰:", e);
    // 失敗時，退回使用清理後的字串
    fixedKey = cleanKeyString;
  }

  // =======================================================================
  // 【4】將 credentials 傳遞給 Google API 函式庫
  // =======================================================================
  const auth = new google.auth.JWT({
    email: clientEmail,
    key: fixedKey,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });

  const calendar = google.calendar({ version: "v3", auth });

  return { calendar, calendarId };
}

/**
 * 建立 Google Calendar 事件
 * 
 * 【SaaS Ready 擴充點】
 * 目前：使用預設 calendarId
 * 未來：可根據 eventData.branchId 動態選擇對應的日曆
 * 
 * @param eventData - 事件資料
 * @param eventData.summary - 事件標題
 * @param eventData.description - 事件描述
 * @param eventData.start - 開始時間 (ISO string)
 * @param eventData.end - 結束時間 (ISO string)
 * @param eventData.branchId - 可選的分店 ID（未來擴充用）
 * @returns { success: boolean, eventId?: string, error?: any }
 */
export async function createCalendarEvent(eventData: {
  summary: string;
  description?: string;
  start: string;
  end: string;
  branchId?: string; // 未來擴充用
}) {
  // =======================================================================
  // 【SaaS Ready】分店擴充點
  // =======================================================================
  // 未來可根據 eventData.branchId 傳遞給 getCalendarClient()
  // const client = getCalendarClient(eventData.branchId);
  // =======================================================================
  const client = getCalendarClient(eventData.branchId);
  if (!client) return { success: false, error: "calendar_init_failed" };

  const { calendar, calendarId } = client;

  try {
    const res = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: eventData.summary,
        description: eventData.description,
        start: { dateTime: eventData.start },
        end: { dateTime: eventData.end },
      },
    });

    return {
      success: true,
      eventId: res.data.id,
    };
  } catch (err) {
    console.error("❌ 建立日曆失敗：", err);
    return { success: false, error: err };
  }
}
