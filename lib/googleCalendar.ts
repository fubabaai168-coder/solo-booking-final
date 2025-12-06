// lib/googleCalendar.ts
import { google } from "googleapis";
import * as fs from "node:fs";
import * as path from "node:path";

const SCOPES = ["https://www.googleapis.com/auth/calendar"];

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
  const { client_email, private_key } = loadServiceAccountKey();

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
  const calendar = await getCalendarClient();

  const calendarId =
    input.calendarId || process.env.GOOGLE_CALENDAR_ID_BRUNCH;

  if (!calendarId) {
    console.error("[GoogleCalendar] Missing calendarId");
    throw new Error("Google Calendar ID not configured");
  }

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

  return res.data; // 內含 id, status, htmlLink 等欄位
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

  // 呼叫底層函式
  return createGoogleCalendarEvent({
    summary,
    description,
    startDateTime,
    endDateTime,
  });
}
