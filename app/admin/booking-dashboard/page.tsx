import { prisma } from "@/lib/prisma";
import { TIME_SLOTS } from "@/lib/timeSlots";
import { TABLES } from "@/lib/seatConfig";
import type { TableUsage } from "@/lib/seatConfig";
import BookingDashboardClient from "./client";

// 強制動態渲染，確保每次請求都獲取最新資料
export const dynamic = "force-dynamic";

// 總座位容量（固定配置）
const TOTAL_CAPACITY = 32; // 2人桌×4 + 4人桌×3 + 6人桌×2 = 8 + 12 + 12 = 32

function buildTaipeiDate(dateStr: string, timeStr: string) {
  // dateStr: "2025-12-07"
  // timeStr: "09:00" / "10:30" 等
  return new Date(`${dateStr}T${timeStr}:00+08:00`);
}

async function getReservationsByDateAndSlot(date: string, slotId: string) {
  try {
    const slot = TIME_SLOTS.find((s) => s.id === slotId);
    if (!slot) {
      return { reservations: [], totalPeople: 0 };
    }

    // 計算該時段的台北時間範圍（強制 +08:00）
    const slotStart = buildTaipeiDate(date, slot.start);
    const slotEnd = buildTaipeiDate(date, slot.end);

    // 在 Prisma 查詢前加上 log（Server 端用）
    console.log("[BookingDashboard] query window", {
      selectedDate: date,
      slotId: slot.id,
      slotStart: slotStart.toISOString(),
      slotEnd: slotEnd.toISOString(),
    });

    // 查詢該時段內的預約
    // 條件：reservedStart >= slotStart AND reservedStart < slotEnd
    // 排除已取消的預約
    const reservations = await prisma.reservation.findMany({
      where: {
        reservedStart: {
          gte: slotStart,
          lt: slotEnd,
        },
        NOT: {
          status: "CANCELLED",
        },
      },
      select: {
        id: true,
        customerName: true,
        peopleCount: true,
        notes: true,
        status: true,
        reservedStart: true,
        reservedEnd: true,
      },
      orderBy: {
        reservedStart: "asc",
      },
    });

    // 計算總人數
    const totalPeople = reservations.reduce(
      (sum, r) => sum + r.peopleCount,
      0
    );

    return { reservations, totalPeople };
  } catch (error) {
    console.error("查詢預約記錄失敗:", error);
    return { reservations: [], totalPeople: 0 };
  }
}

function formatDateForDisplay(dateStr: string): string {
  return dateStr.replace(/-/g, "/");
}

interface PageProps {
  searchParams?: { date?: string; slotId?: string };
}

export default async function BookingDashboardPage({
  searchParams,
}: PageProps) {
  // 取得今天的日期字串（YYYY-MM-DD）
  const today = new Date().toISOString().slice(0, 10);
  
  // 從 query 取得日期和時段，若無則使用預設值
  const selectedDate = searchParams?.date || today;
  const selectedSlotId = searchParams?.slotId || TIME_SLOTS[0].id;

  // 查詢資料
  const { reservations, totalPeople } = await getReservationsByDateAndSlot(
    selectedDate,
    selectedSlotId
  );

  // 計算百分比（處理除以 0 的情況）
  const percentage =
    TOTAL_CAPACITY > 0
      ? Math.round((totalPeople / TOTAL_CAPACITY) * 100)
      : 0;
  const selectedSlot = TIME_SLOTS.find((s) => s.id === selectedSlotId);

  // 計算桌子使用狀態
  let remaining = totalPeople;
  const tableUsages: TableUsage[] = TABLES.map((t) => {
    const used = remaining > 0;
    remaining = Math.max(0, remaining - t.capacity);
    return { ...t, used };
  });

  return (
    <BookingDashboardClient
      timeSlots={TIME_SLOTS}
      selectedDate={selectedDate}
      selectedSlotId={selectedSlotId}
      reservations={reservations}
      totalPeople={totalPeople}
      totalCapacity={TOTAL_CAPACITY}
      percentage={percentage}
      selectedSlotLabel={selectedSlot?.label || ""}
      tableUsages={tableUsages}
    />
  );
}
