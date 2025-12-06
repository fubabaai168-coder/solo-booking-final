export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createGoogleCalendarEvent } from "@/lib/googleCalendar";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const summary: string = body.summary ?? "SoloAI 早午餐測試預約";
    const description: string =
      body.description ??
      "由 SoloAI 後端透過 Google Calendar Service Account 建立";
    const startDateTime: string = body.startDateTime;
    const endDateTime: string = body.endDateTime;
    const calendarId: string | undefined = body.calendarId;

    if (!startDateTime || !endDateTime) {
      return NextResponse.json(
        { message: "startDateTime 與 endDateTime 為必填欄位" },
        { status: 400 },
      );
    }

    const event = await createGoogleCalendarEvent({
      summary,
      description,
      startDateTime,
      endDateTime,
      calendarId,
    });

    return NextResponse.json(
      {
        message: "事件建立成功",
        eventId: event.id,
        status: event.status,
        htmlLink: event.htmlLink,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("[API] /api/google-calendar/create-event error", error);

    return NextResponse.json(
      {
        message: "建立 Google Calendar 事件失敗",
        error: error?.message ?? "Unknown error",
      },
      { status: 500 },
    );
  }
}
