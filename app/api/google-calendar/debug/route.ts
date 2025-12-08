import { NextResponse } from "next/server";
import { getCalendarClient } from "@/lib/googleCalendar";

export const runtime = "nodejs";

export async function GET() {
  const client = getCalendarClient();

  if (!client) {
    return NextResponse.json(
      { success: false, message: "環境變數缺失" },
      { status: 500 }
    );
  }

  const { calendar } = client;

  try {
    // 列出前 1 筆事件作為驗證
    const res = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID!,
      maxResults: 1,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Google Calendar 連線成功",
        firstEvent: res.data.items ?? [],
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        message: "Google Calendar API 連線失敗",
        error: String(err),
      },
      { status: 500 }
    );
  }
}
