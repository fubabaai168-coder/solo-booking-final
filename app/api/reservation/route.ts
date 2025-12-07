import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createCalendarEventFromReservation } from "@/lib/googleCalendar";

export const runtime = "nodejs";

function buildTaipeiDate(dateStr: string, timeStr: string) {
  // dateStr: "2025-12-07"
  // timeStr: "09:00" / "10:30" 等
  return new Date(`${dateStr}T${timeStr}:00+08:00`);
}

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

    // 解析時間格式：time 格式為 "HH:MM-HH:MM" 或 "HH:MM - HH:MM"
    const timeStr = time.replace(/\s+/g, ""); // 移除所有空格
    const [startStr, endStr] = timeStr.split("-");

    if (!startStr || !endStr) {
      return NextResponse.json(
        { success: false, message: '時段格式錯誤，應為 "HH:MM-HH:MM" 格式' },
        { status: 400 }
      );
    }

    const [startHour, startMinute] = startStr.split(":");
    const [endHour, endMinute] = endStr.split(":");

    if (!startHour || !startMinute || !endHour || !endMinute) {
      return NextResponse.json(
        { success: false, message: "時段格式錯誤" },
        { status: 400 }
      );
    }

    // 轉換為台北時間 (UTC+8) 的 Date 物件
    const reservedStart = buildTaipeiDate(date, `${startHour}:${startMinute}`);
    const reservedEnd = buildTaipeiDate(date, `${endHour}:${endMinute}`);

    // 新增預約到資料庫（使用符合 Prisma schema 的欄位）
    const reservation = await prisma.reservation.create({
      data: {
        customerName: name,
        phone: phone || "",
        peopleCount: Number(people) || 1,
        reservedStart,
        reservedEnd,
        notes: note || null,
        status: "PENDING",
      },
    });

    // 嘗試建立 Google 日曆事件
    try {
      const calendarEvent = await createCalendarEventFromReservation({
        name,
        phone,
        date,
        time,
        people,
        notes: note,
      });

      // 更新資料庫寫入 calendarEventId
      if (calendarEvent?.id) {
        await prisma.reservation.update({
          where: { id: reservation.id },
          data: { calendarEventId: calendarEvent.id },
        });
      }
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
