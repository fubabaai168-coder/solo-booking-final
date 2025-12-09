import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(req: NextRequest) {
  try {
    const serviceEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    const calendarId = process.env.GOOGLE_CALENDAR_ID;

    if (!serviceEmail || !rawKey || !calendarId) {
      return NextResponse.json(
        {
          success: false,
          message: "環境變數缺失",
          serviceEmail,
          rawKeyExists: !!rawKey,
          calendarId,
        },
        { status: 500 }
      );
    }

    // 關鍵：修正換行
    const cleanedKey = rawKey.replace(/\\n/g, "\n");

    const auth = new google.auth.JWT({
      email: serviceEmail,
      key: cleanedKey,
      scopes: ["https://www.googleapis.com/auth/calendar"],
    });

    const calendar = google.calendar({ version: "v3", auth });

    // 測試讀取事件（只讀取 1 筆）
    const r = await calendar.events.list({
      calendarId,
      maxResults: 1,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Google Calendar 連線成功",
        items: r.data.items || [],
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("❌ Calendar Test Error:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Google API 呼叫失敗",
        error: String(err),
      },
      { status: 500 }
    );
  }
}

