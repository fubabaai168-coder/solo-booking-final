import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TIME_SLOTS } from "@/lib/timeSlots";

// =======================================================================
// 類型定義
// =======================================================================

type CreateReservationRequestBody = {
  name: string;        // 顧客姓名
  guests: number;     // 人數
  date: string;       // 日期 (格式: YYYY-MM-DD)
  timeSlot: string;   // 時段 ID (例如: "MORNING_1")
  phone?: string;     // 電話（可選，但建議提供）
  notes?: string;     // 備註（可選）
};

// =======================================================================
// POST 函式
// =======================================================================

export async function POST(request: NextRequest) {
  try {
    // 1. 解析請求 Body
    const body = await request.json();
    console.log('[reservations/create] 收到請求 body:', JSON.stringify(body, null, 2));
    
    // 支援兩種格式：
    // 格式 A: { name, guests, date, timeSlot, phone, notes } (舊格式)
    // 格式 B: { customerName, peopleCount, reservedStart, reservedEnd, phone, notes } (前端目前使用的格式)
    const name = body.name || body.customerName;
    const guests = body.guests || body.peopleCount;
    const date = body.date;
    const timeSlot = body.timeSlot;
    const phone = body.phone;
    const notes = body.notes;
    const reservedStart = body.reservedStart;
    const reservedEnd = body.reservedEnd;

    // 2. 基本驗證：必填欄位
    if (!name || typeof name !== "string" || name.trim() === "") {
      console.error('[reservations/create] name 欄位驗證失敗:', { name, body });
      return NextResponse.json(
        { error: "name (或 customerName) is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    // 3. 處理人數 (guests 或 peopleCount)
    if (guests === undefined || guests === null) {
      console.error('[reservations/create] guests/peopleCount 欄位驗證失敗:', { guests, body });
      return NextResponse.json(
        { error: "guests (或 peopleCount) is required" },
        { status: 400 }
      );
    }

    const guestsNumber = typeof guests === "string" ? parseInt(guests, 10) : Number(guests);
    if (Number.isNaN(guestsNumber) || guestsNumber <= 0 || !Number.isInteger(guestsNumber)) {
      console.error('[reservations/create] guests/peopleCount 數值驗證失敗:', { guests, guestsNumber });
      return NextResponse.json(
        { error: "guests (或 peopleCount) must be a positive integer" },
        { status: 400 }
      );
    }

    // 4. 處理時間：支援兩種格式
    let finalReservedStart: Date;
    let finalReservedEnd: Date;

    if (reservedStart && reservedEnd) {
      // 格式 B: 前端已經計算好 reservedStart 和 reservedEnd
      finalReservedStart = new Date(reservedStart);
      finalReservedEnd = new Date(reservedEnd);
    } else if (date && timeSlot) {
      // 格式 A: 需要從 date + timeSlot 計算
      const slot = TIME_SLOTS.find((s) => s.id === timeSlot);
      if (!slot) {
        console.error('[reservations/create] 無效的 timeSlot:', { timeSlot, body });
        return NextResponse.json(
          { error: `Invalid timeSlot. Valid values: ${TIME_SLOTS.map((s) => s.id).join(", ")}` },
          { status: 400 }
        );
      }
      finalReservedStart = new Date(`${date}T${slot.start}`);
      finalReservedEnd = new Date(`${date}T${slot.end}`);
    } else {
      console.error('[reservations/create] 缺少時間資訊:', { date, timeSlot, reservedStart, reservedEnd, body });
      return NextResponse.json(
        { error: "必須提供 (date + timeSlot) 或 (reservedStart + reservedEnd)" },
        { status: 400 }
      );
    }

    // 5. 驗證日期是否有效
    if (Number.isNaN(finalReservedStart.getTime()) || Number.isNaN(finalReservedEnd.getTime())) {
      console.error('[reservations/create] 日期格式無效:', { finalReservedStart, finalReservedEnd });
      return NextResponse.json(
        { error: "Invalid date or timeSlot format" },
        { status: 400 }
      );
    }

    // 6. 禁止預約過去時間
    const now = new Date();
    if (finalReservedEnd <= now) {
      console.error('[reservations/create] 嘗試預約過去時間:', { finalReservedEnd, now });
      return NextResponse.json(
        { error: "Cannot create reservation in the past" },
        { status: 400 }
      );
    }

    // 7. 處理 phone（如果未提供，使用空字串或預設值）
    // 注意：根據 schema，phone 是必填欄位，所以這裡設為必填或提供預設值
    if (!phone || typeof phone !== "string" || phone.trim() === "") {
      console.error('[reservations/create] phone 欄位驗證失敗:', { phone, body });
      return NextResponse.json(
        { error: "phone is required and must be a non-empty string" },
        { status: 400 }
      );
    }
    const phoneValue = phone.trim();

    // 8. 使用 Prisma 創建 Reservation
    console.log('[reservations/create] 準備建立預約:', {
      customerName: name.trim(),
      phone: phoneValue,
      peopleCount: guestsNumber,
      reservedStart: finalReservedStart.toISOString(),
      reservedEnd: finalReservedEnd.toISOString(),
      notes: notes && notes.trim() !== "" ? notes.trim() : null,
    });

    const newReservation = await prisma.reservation.create({
      data: {
        customerName: name.trim(),
        phone: phoneValue,
        peopleCount: guestsNumber,
        reservedStart: finalReservedStart,
        reservedEnd: finalReservedEnd,
        notes: notes && notes.trim() !== "" ? notes.trim() : null,
        status: "PENDING", // 預設狀態
      },
    });

    console.log('[reservations/create] 預約建立成功:', { id: newReservation.id });

    // 9. 成功回應
    return NextResponse.json(
      {
        message: "預約建立成功",
        reservation: {
          id: newReservation.id,
          customerName: newReservation.customerName,
          phone: newReservation.phone,
          peopleCount: newReservation.peopleCount,
          reservedStart: newReservation.reservedStart.toISOString(),
          reservedEnd: newReservation.reservedEnd.toISOString(),
          status: newReservation.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[reservations/create] POST error", error);

    // 處理 Prisma 錯誤
    if (error instanceof Error) {
      // 如果是 Prisma 驗證錯誤
      if (error.message.includes("Unique constraint") || error.message.includes("Foreign key")) {
        return NextResponse.json(
          { error: "Database constraint violation" },
          { status: 400 }
        );
      }
    }

    // 其他錯誤
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
