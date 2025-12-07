import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createGoogleCalendarEvent } from "@/lib/google";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    const { name, email, phone, date, time, people, note } = data;

    if (!name || !email || !date || !time || !people) {
      return NextResponse.json(
        { success: false, message: "缺少必要欄位" },
        { status: 400 }
      );
    }

    // 新增預約到資料庫
    const reservation = await prisma.reservation.create({
      data: {
        name,
        email,
        phone,
        date,
        time,
        people,
        note,
      },
    });

    // 嘗試建立 Google 日曆事件
    try {
      const calendarEventId = await createGoogleCalendarEvent({
        name,
        email,
        phone,
        date,
        time,
        people,
        note,
      });

      // 更新資料庫寫入 calendarEventId
      await prisma.reservation.update({
        where: { id: reservation.id },
        data: { calendarEventId },
      });
    } catch (calendarError: any) {
      console.error("⚠️Google日曆同步失敗（預訂仍已儲存）:", calendarError.message);
      console.error("錯誤詳情:", calendarError);
    }

    return NextResponse.json(
      { success: true, message: "預約已成功建立", reservation },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Reservation API 錯誤:", err);
    return NextResponse.json(
      { success: false, message: "伺服器錯誤", detail: String(err) },
      { status: 500 }
    );
  }
}
