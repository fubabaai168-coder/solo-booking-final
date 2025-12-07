import { google } from "googleapis";

// 讀取環境變數（與 debug API 完全一致）
const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const rawGooglePrivateKey = process.env.GOOGLE_PRIVATE_KEY;
const calendarId = process.env.GOOGLE_CALENDAR_ID;

// 檢查環境變數（與 debug API 完全一致）
if (!serviceAccountEmail || !rawGooglePrivateKey || !calendarId) {
  console.error("[GCalendar][ConfigError]", {
    hasServiceAccountEmail: !!serviceAccountEmail,
    hasRawPrivateKey: !!rawGooglePrivateKey,
    hasCalendarId: !!calendarId,
  });
}

// 處理 private key（與 debug API 完全一致）
const googlePrivateKey = rawGooglePrivateKey?.replace(/\\n/g, "\n") ?? undefined;

/**
 * 建立 Google Calendar client（與 debug API 完全一致的流程）
 */
async function getCalendarClient() {
  if (!serviceAccountEmail || !googlePrivateKey) {
    throw new Error("Google Calendar service account env is not configured");
  }

  const jwtClient = new google.auth.JWT({
    email: serviceAccountEmail,
    key: googlePrivateKey,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });

  await jwtClient.authorize();

  return google.calendar({ version: "v3", auth: jwtClient });
}

/**
 * 建立 Google Calendar 事件的參數類型
 */
export type CreateGoogleCalendarEventParams = {
  summary: string;
  description?: string;
  startDateTime: string; // ISO string
  endDateTime: string;   // ISO string
  timeZone?: string;     // default: "Asia/Taipei"
};

/**
 * 建立 Google Calendar 事件
 * 
 * @param params - 事件參數
 * @returns Google Calendar 事件資料（包含 id, htmlLink 等）
 */
export async function createGoogleCalendarEvent(
  params: CreateGoogleCalendarEventParams
) {
  const {
    summary,
    description,
    startDateTime,
    endDateTime,
    timeZone = "Asia/Taipei",
  } = params;

  if (!calendarId) {
    console.error("[GCalendar][CreateEvent][ConfigError]", {
      hasCalendarId: !!calendarId,
    });
    throw new Error("GOOGLE_CALENDAR_ID is not configured");
  }

  console.log("[GCalendar][CreateEvent][Start]", {
    summary,
    startDateTime,
    endDateTime,
    timeZone,
    calendarId,
  });

  try {
    const calendar = await getCalendarClient();

    const event = {
      summary,
      description: description ?? "",
      start: {
        dateTime: startDateTime,
        timeZone,
      },
      end: {
        dateTime: endDateTime,
        timeZone,
      },
    };

    const response = await calendar.events.insert({
      calendarId,
      requestBody: event,
    });

    console.log("[GCalendar][CreateEvent][Success]", {
      calendarId,
      eventId: response.data.id,
      htmlLink: response.data.htmlLink,
    });

    return response.data;
  } catch (err: any) {
    console.error("[GCalendar][CreateEvent][Error]", {
      calendarId,
      errorCode: err?.code,
      errorMessage:
        err?.errors?.[0]?.message ||
        err?.message ||
        "Unknown calendar error",
      rawErrors: err?.errors,
    });
    throw err;
  }
}
