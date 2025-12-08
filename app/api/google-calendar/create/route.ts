import { NextRequest, NextResponse } from "next/server";
import { createCalendarEvent } from "@/lib/googleCalendar";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { summary, description, start, end } = body;

    if (!summary || !start || !end) {
      return NextResponse.json(
        { success: false, message: "缺少必要欄位" },
        { status: 400 }
      );
    }

    const res = await createCalendarEvent({
      summary,
      description,
      start,
      end,
    });

    if (!res.success) {
      return NextResponse.json(
        { success: false, message: "建立日曆失敗", error: res.error },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        eventId: res.eventId,
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "API 發生例外錯誤", error: String(err) },
      { status: 500 }
    );
  }
}

