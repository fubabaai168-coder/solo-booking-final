// lib/googleCalendar.ts
import { google } from "googleapis";
import * as fs from "node:fs";
import * as path from "node:path";

const SCOPES = ["https://www.googleapis.com/auth/calendar"];

// 集中管理 calendarId 並方便 log
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || "43cf07ce5a94c83d80110b3c9cd29d32ac1a9aec7057c09c03aff94d16e04d40@group.calendar.google.com";

type CreateEventInput = {
  summary: string;
  description?: string;
  startDateTime: string; // ISO，例如 "2025-12-04T21:00:00+08:00"
  endDateTime: string;   // ISO
  calendarId?: string;   // 未提供則使用預設早午餐 Calendar
};

function loadServiceAccountKey() {
  const keyPath = path.join(
    process.cwd(),
    "service-account",
    "google-calendar-service-account.json",
  );

  console.log("[GoogleCalendar] 讀取 Service Account 金鑰，keyPath =", keyPath);

  let raw: string;
  try {
    raw = fs.readFileSync(keyPath, "utf-8");
  } catch (error) {
    console.error(
      "[GoogleCalendar] 讀取金鑰檔案失敗：",
      (error as Error)?.message ?? error,
    );
    throw new Error(
      `無法讀取 Service Account 金鑰檔案: ${keyPath}\n` +
        "請確認檔案存在且目前執行帳號有權限讀取。"
    );
  }

  const json = JSON.parse(raw) as {
    client_email: string;
    private_key: string;
  };

  const expectedEmail =
    "backend-core-user@localbiz-saas-core.iam.gserviceaccount.com";

  if (json.client_email !== expectedEmail) {
    console.warn(
      `[GoogleCalendar] 警告：Service Account email 不符預期\n` +
        `預期: ${expectedEmail}\n` +
        `實際: ${json.client_email}\n` +
        "請確認使用正確的 Service Account 金鑰檔案"
    );
  }

  return json;
}

async function getCalendarClient() {
  // 優先使用環境變數，如果不存在則使用檔案
  const googleServiceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawGooglePrivateKey = process.env.GOOGLE_PRIVATE_KEY || "";
  const googlePrivateKey = rawGooglePrivateKey.replace(/\\n/g, "\n");

  let client_email: string;
  let private_key: string;

  if (googleServiceAccountEmail && rawGooglePrivateKey) {
    // 使用環境變數
    console.log("[GCalendar][Auth] 使用環境變數建立認證");
    client_email = googleServiceAccountEmail;
    private_key = googlePrivateKey;
  } else {
    // 使用檔案
    console.log("[GCalendar][Auth] 使用檔案建立認證");
    const keyData = loadServiceAccountKey();
    client_email = keyData.client_email;
    private_key = keyData.private_key;
  }

  const auth = new google.auth.JWT({
    email: client_email,
    key: private_key,
    scopes: SCOPES,
  });

  await auth.authorize();

  return google.calendar({
    version: "v3",
    auth,
  });
}

export async function createGoogleCalendarEvent(input: CreateEventInput) {
  // === 函式開始 log ===
  console.log("[GCalendar][Lib][CreateEvent][Start]", {
    summary: input.summary,
    start: input.startDateTime,
    end: input.endDateTime,
    calendarId: input.calendarId || "使用預設",
  });

  // === 環境變數檢查與 log ===
  const googleServiceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawGooglePrivateKey = process.env.GOOGLE_PRIVATE_KEY || "";
  const googleCalendarId = process.env.GOOGLE_CALENDAR_ID;

  // 修正 Vercel 將換行存成 '\n' 字串的問題
  const googlePrivateKey = rawGooglePrivateKey.replace(/\\n/g, "\n");

  console.log("[GCalendar][Lib][Config]", {
    hasServiceAccountEmail: !!googleServiceAccountEmail,
    hasPrivateKey: !!rawGooglePrivateKey,
    hasCalendarId: !!googleCalendarId,
  });

  if (!googleServiceAccountEmail || !rawGooglePrivateKey || !googleCalendarId) {
    console.error("[GCalendar][Lib][Config][MissingEnv]", {
      hasServiceAccountEmail: !!googleServiceAccountEmail,
      hasPrivateKey: !!rawGooglePrivateKey,
      hasCalendarId: !!googleCalendarId,
    });
    // 保持原本行為：如果目前程式是「只印錯誤但不中止預約」，就不要 throw，只是 log
    // 如果原本有特定錯誤處理邏輯，請依原邏輯延續。
  }

  const calendar = await getCalendarClient();

  const calendarId =
    input.calendarId || process.env.GOOGLE_CALENDAR_ID_BRUNCH || googleCalendarId || CALENDAR_ID;

  if (!calendarId) {
    console.error("[GCalendar][Lib][Config][MissingCalendarId]");
    throw new Error("Google Calendar ID not configured");
  }

  // 印出實際使用的 calendarId，方便除錯
  console.log("[GCalendar][Lib][CreateEvent][CalendarId]", {
    actualCalendarId: calendarId,
    source: input.calendarId 
      ? "input.calendarId" 
      : process.env.GOOGLE_CALENDAR_ID_BRUNCH 
        ? "GOOGLE_CALENDAR_ID_BRUNCH" 
        : googleCalendarId 
          ? "GOOGLE_CALENDAR_ID" 
          : "CALENDAR_ID (fallback)",
  });

  try {
    // Request 級別的 log，印出要寫入的關鍵欄位
    console.log("[GCalendar][Request]", {
      calendarId: CALENDAR_ID,
      summary: input.summary,
      start: new Date(input.startDateTime).toISOString(),
      end: new Date(input.endDateTime).toISOString(),
    });

    const res = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: input.summary,
        description: input.description ?? "",
        start: {
          dateTime: input.startDateTime,
        },
        end: {
          dateTime: input.endDateTime,
        },
      },
    });

    console.log("[GCalendar][Lib][CreateEvent][Success]", {
      eventId: res.data.id,
      status: res.status,
      calendarId: calendarId,
    });

    return res.data; // 內含 id, status, htmlLink 等欄位
  } catch (error: any) {
    // 補強原始錯誤輸出：印出實際使用的 calendarId 與 Google 回傳的原始錯誤內容
    console.error("[GCalendar][Error][Raw]", {
      calendarId: CALENDAR_ID,
      errorMessage: error?.message,
      errorCode: error?.code,
      errorResponse: error?.response?.data,
    });
    // 保留原本對錯誤的處理方式：重新 throw，讓上層處理
    throw error;
  }
}

// 匯出 createCalendarEvent 作為 createGoogleCalendarEvent 的別名
export const createCalendarEvent = createGoogleCalendarEvent;

// 包裝函式：接收預約格式的參數，轉換後呼叫 createGoogleCalendarEvent
type CreateCalendarEventInput = {
  name: string;
  phone: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM-HH:MM 格式
  people: number;
  notes?: string;
};

export async function createCalendarEventFromReservation(input: CreateCalendarEventInput) {
  // 設定與除錯 log
  console.log("[GCalendar][Config]", {
    calendarId: CALENDAR_ID,
  });

  // 解析時間格式：time 格式為 "HH:MM-HH:MM" 或 "HH:MM - HH:MM"
  const timeStr = input.time.replace(/\s+/g, ""); // 移除所有空格
  const [startStr, endStr] = timeStr.split("-");

  if (!startStr || !endStr) {
    throw new Error('時段格式錯誤，應為 "HH:MM-HH:MM" 格式');
  }

  const [startHour, startMinute] = startStr.split(":");
  const [endHour, endMinute] = endStr.split(":");

  if (!startHour || !startMinute || !endHour || !endMinute) {
    throw new Error("時段格式錯誤");
  }

  // 轉換為 ISO 8601 格式（台北時間 UTC+8）
  const startDateTime = `${input.date}T${startHour.padStart(2, "0")}:${startMinute.padStart(2, "0")}:00+08:00`;
  const endDateTime = `${input.date}T${endHour.padStart(2, "0")}:${endMinute.padStart(2, "0")}:00+08:00`;

  // 轉換為 Date 物件供 log 使用
  const startDate = new Date(startDateTime);
  const endDate = new Date(endDateTime);

  // 組合 summary 和 description
  const summary = `${input.name} - ${input.people}人預約`;
  const description = [
    `姓名：${input.name}`,
    `電話：${input.phone}`,
    `人數：${input.people} 人`,
    input.notes ? `備註：${input.notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  // Request 級別的 log，印出要寫入的關鍵欄位
  console.log("[GCalendar][Request]", {
    calendarId: CALENDAR_ID,
    summary,
    start: startDate.toISOString(),
    end: endDate.toISOString(),
  });

  // 呼叫底層函式
  return createGoogleCalendarEvent({
    summary,
    description,
    startDateTime,
    endDateTime,
  });
}

// [GCalendar] lib logging & env diagnostics added
