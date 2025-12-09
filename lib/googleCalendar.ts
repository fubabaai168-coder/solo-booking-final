import { google } from "googleapis";
import { Buffer } from "buffer";

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
  // 【1】從 Vercel 環境變數讀取 Base64 編碼的服務帳號金鑰
  // =======================================================================
  const base64Key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64;
  
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

  if (!base64Key || !calendarId) {
    console.error("❌ 缺少 Google Calendar 必要環境變數", {
      hasBase64Key: !!base64Key,
      hasCalendarId: !!calendarId,
    });
    return null;
  }

  // =======================================================================
  // 【2】將 Base64 字串解碼回原始的 JSON 字串
  // =======================================================================
  let credentials: any;
  
  try {
    const decodedJsonString = Buffer.from(base64Key, "base64").toString("utf8");
    credentials = JSON.parse(decodedJsonString);
    
    // 驗證必要欄位
    if (!credentials.client_email || !credentials.private_key) {
      console.error("❌ 解碼後的憑證缺少必要欄位", {
        hasClientEmail: !!credentials.client_email,
        hasPrivateKey: !!credentials.private_key,
      });
      return null;
    }
    
    console.log("✅ 成功解碼服務帳號憑證，Email:", credentials.client_email);
  } catch (e: any) {
    console.error("❌ 無法解碼服務帳號憑證:", e.message);
    return null;
  }

  // =======================================================================
  // 【3】使用解碼後的憑證進行服務初始化（使用 JWT）
  // =======================================================================
  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
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
