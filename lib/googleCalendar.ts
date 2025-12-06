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
