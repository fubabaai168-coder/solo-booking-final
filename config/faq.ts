// FAQ / Knowledge Base 設定檔
// 用於前台 FAQ 頁面與客服 Bot 知識庫

// ===== 型別定義 =====

export type FaqCategory =
  | "HOURS"
  | "LOCATION"
  | "RESERVATION_RULES"
  | "CANCELLATION"
  | "OTHER";

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: FaqCategory;
  tags?: readonly string[];
  isForBotOnly?: boolean;
}

// ===== FAQ 資料 =====

export const FAQ_ITEMS: readonly FaqItem[] = [
  // A. 營業時間
  {
    id: "hours-weekday",
    question: "平日營業時間是幾點？",
    answer: "我們平日（週一至週五）的營業時間為 09:00 - 15:00。最後點餐時間為 14:30。",
    category: "HOURS",
    tags: ["營業時間", "平日", "週一到週五", "幾點開", "幾點關"],
  },
  {
    id: "hours-weekend",
    question: "週末營業時間是幾點？",
    answer: "我們週末（週六、週日）的營業時間為 09:00 - 15:00。最後點餐時間為 14:30。",
    category: "HOURS",
    tags: ["營業時間", "週末", "週六", "週日", "假日", "幾點開"],
  },

  // B. 店址與交通
  {
    id: "location-address",
    question: "店址在哪裡？",
    answer: "我們位於台北市信義區。詳細地址請參考我們的官方網站或社群媒體。",
    category: "LOCATION",
    tags: ["地址", "店址", "位置", "在哪裡", "地點"],
  },
  {
    id: "location-mrt",
    question: "怎麼搭捷運到店裡？",
    answer: "您可以搭乘捷運至信義線相關站點，出站後步行約 5-10 分鐘即可抵達。建議使用 Google Maps 導航。",
    category: "LOCATION",
    tags: ["捷運", "交通", "怎麼去", "MRT", "地鐵"],
  },
  {
    id: "location-parking",
    question: "附近有停車場嗎？",
    answer: "店舖附近有付費停車場，但建議您搭乘大眾運輸工具前來，更為便利環保。",
    category: "LOCATION",
    tags: ["停車", "停車場", "開車", "停車位"],
  },

  // C. 預約規則
  {
    id: "reservation-time-slots",
    question: "有哪些用餐時段可以預約？",
    answer: "我們提供以下固定用餐時段：09:00–10:30、10:30–12:00、12:00–13:30、13:30–15:00。請在預約時選擇您偏好的時段。",
    category: "RESERVATION_RULES",
    tags: ["時段", "用餐時間", "預約時間", "幾點", "時段選擇"],
  },
  {
    id: "reservation-past-time",
    question: "可以預約過去的時間嗎？",
    answer: "不行，系統會自動檢查並禁止預約過去的時間。請選擇未來的日期與時段進行預約。",
    category: "RESERVATION_RULES",
    tags: ["過去時間", "歷史日期", "預約限制", "時間限制"],
  },
  {
    id: "reservation-walk-in",
    question: "可以現場候位嗎？",
    answer: "可以，但建議您先透過線上預約系統預訂，以確保有座位。現場候位將依當日座位狀況安排，可能需要等待。",
    category: "RESERVATION_RULES",
    tags: ["現場", "候位", "walk-in", "臨時", "沒預約"],
  },
  {
    id: "reservation-min-people",
    question: "預約最少要幾個人？",
    answer: "預約最少需要 1 人。您可以透過線上預約系統選擇人數，系統會自動為您安排合適的座位。",
    category: "RESERVATION_RULES",
    tags: ["人數", "最少", "一個人", "單人", "人數限制"],
  },

  // D. 取消 / 修改預約
  {
    id: "cancellation-how",
    question: "如何取消或修改預約？",
    answer: "目前 Demo 版本如需取消或修改預約，請透過電話聯絡或 Instagram 私訊我們，我們會盡快為您處理。未來將推出線上取消功能，敬請期待。",
    category: "CANCELLATION",
    tags: ["取消", "修改", "變更", "取消預約", "改時間"],
  },
  {
    id: "cancellation-deadline",
    question: "最晚什麼時候可以取消預約？",
    answer: "建議您至少提前 24 小時通知我們取消或修改預約，以便我們安排其他客人。如有緊急情況，請盡快與我們聯繫。",
    category: "CANCELLATION",
    tags: ["取消期限", "最晚", "提前", "通知時間"],
  },

  // E. 基本用餐規則
  {
    id: "dining-duration",
    question: "用餐時間有限制嗎？",
    answer: "每個用餐時段為 90 分鐘，請您在時段內完成用餐，以便我們為下一組客人準備座位。",
    category: "OTHER",
    tags: ["用餐時間", "時間限制", "90分鐘", "時段", "用餐時長"],
  },
  {
    id: "dining-pets",
    question: "可以帶寵物嗎？",
    answer: "可以，但請將寵物放置於寵物推車或提籃中，並確保不影響其他客人。詳細規定請以店內公告為主，或於預約時備註告知。",
    category: "OTHER",
    tags: ["寵物", "帶狗", "帶貓", "毛小孩", "寵物推車"],
  },

  // F. Bot Only 知識（不顯示在公開 FAQ）
  {
    id: "bot-calendar-integration",
    question: "系統會自動建立 Google Calendar 事件",
    answer: "當客人完成預約後，系統會自動在 Google Calendar 建立對應的活動事件，方便店家管理與追蹤。",
    category: "OTHER",
    tags: ["Google Calendar", "日曆", "系統整合", "自動建立"],
    isForBotOnly: true,
  },
  {
    id: "bot-reservation-query",
    question: "如何查詢預約記錄",
    answer: "可以透過後台管理系統查詢預約記錄，或使用 API 查詢特定日期與時段的預約狀況。",
    category: "OTHER",
    tags: ["查詢", "預約記錄", "後台", "API", "系統查詢"],
    isForBotOnly: true,
  },
] as const;

// ===== 搜尋輔助函式 =====

/**
 * 根據關鍵字搜尋 FAQ
 * @param keyword 搜尋關鍵字
 * @returns 匹配的 FAQ 項目陣列，按相關度排序
 */
export function searchFaqByKeyword(keyword: string): FaqItem[] {
  const lowerKeyword = keyword.toLowerCase().trim();

  if (!lowerKeyword) {
    return [];
  }

  // 計算每個 FAQ 的相關度分數
  const scoredItems: Array<{ item: FaqItem; score: number }> = [];

  for (const item of FAQ_ITEMS) {
    let score = 0;

    // tags 命中：最高優先級（分數 +10）
    if (item.tags) {
      for (const tag of item.tags) {
        if (tag.toLowerCase().includes(lowerKeyword)) {
          score += 10;
          break; // 一個 tag 命中就足夠
        }
      }
    }

    // question 命中：高優先級（分數 +5）
    if (item.question.toLowerCase().includes(lowerKeyword)) {
      score += 5;
    }

    // answer 命中：低優先級（分數 +1）
    if (item.answer.toLowerCase().includes(lowerKeyword)) {
      score += 1;
    }

    // 只有分數 > 0 的項目才加入結果
    if (score > 0) {
      scoredItems.push({ item, score });
    }
  }

  // 按分數降序排序，分數相同時保持原順序
  scoredItems.sort((a, b) => b.score - a.score);

  // 回傳 FAQ 項目陣列
  return scoredItems.map(({ item }) => item);
}

// ===== 輔助函式 =====

/**
 * 根據分類取得 FAQ 項目
 * @param category FAQ 分類
 * @param includeBotOnly 是否包含 Bot Only 項目（預設 false）
 * @returns 該分類的 FAQ 項目陣列
 */
export function getFaqByCategory(
  category: FaqCategory,
  includeBotOnly: boolean = false
): FaqItem[] {
  return FAQ_ITEMS.filter(
    (item) =>
      item.category === category &&
      (includeBotOnly || !item.isForBotOnly)
  );
}

/**
 * 取得所有公開的 FAQ 項目（排除 Bot Only）
 * @returns 公開的 FAQ 項目陣列
 */
export function getPublicFaqItems(): FaqItem[] {
  return FAQ_ITEMS.filter((item) => !item.isForBotOnly);
}









