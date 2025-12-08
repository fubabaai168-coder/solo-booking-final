import { NextResponse } from "next/server";

import { google } from "googleapis";

export const runtime = "nodejs";

export async function GET() {
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  const privateKey = rawKey?.replace(/\\n/g, "\n");

  console.log("[GCalDebug] ENV Check", {
    hasEmail: !!serviceAccountEmail,
    hasPrivateKey: !!rawKey,
    hasCalendarId: !!calendarId,
  });

  if (!serviceAccountEmail || !privateKey || !calendarId) {
    return NextResponse.json(
      {
        success: false,
        message: "缺少 Google Calendar 設定",
        env: {
          serviceAccountEmail,
          privateKeyExists: !!privateKey,
          calendarId,
        },
      },
      { status: 500 }
    );
  }

  try {
    const jwtClient = new google.auth.JWT({
      email: serviceAccountEmail,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/calendar"],
    });

    await jwtClient.authorize();

    const calendar = google.calendar({ version: "v3", auth: jwtClient });

    // 建立一個測試事件（1 分鐘）
    const now = new Date();
    const end = new Date(now.getTime() + 60 * 1000);

    const event = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: "🔧 Debug Test Event",
        start: { dateTime: now.toISOString(), timeZone: "Asia/Taipei" },
        end: { dateTime: end.toISOString(), timeZone: "Asia/Taipei" },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "成功建立測試事件",
        calendarEventId: event.data.id,
        link: event.data.htmlLink,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[GCalDebug Error]", err);

    return NextResponse.json(
      {
        success: false,
        message: "建立日曆事件失敗",
        error: err?.message || "unknown",
        raw: err,
      },
      { status: 500 }
    );
  }
}

