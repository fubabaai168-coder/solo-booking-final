import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ReservationStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";

// 強制動態渲染，確保每次請求都獲取最新資料
export const dynamic = "force-dynamic";

type StatusFilter = "all" | "PENDING" | "CONFIRMED" | "CANCELLED";

async function getReservations(statusFilter?: string) {
  try {
    // 安全地將 string 轉換為 ReservationStatus enum
    const rawStatus = statusFilter && statusFilter !== "all" ? statusFilter : undefined;
    const status =
      rawStatus && Object.values(ReservationStatus).includes(rawStatus as ReservationStatus)
        ? (rawStatus as ReservationStatus)
        : undefined;

    // 定義 where 條件，確保型別符合 Prisma 的 ReservationWhereInput
    const where: Prisma.ReservationWhereInput = status
      ? { status }
      : {};

    const reservations = await prisma.reservation.findMany({
      where,
      select: {
        id: true,
        customerName: true,
        peopleCount: true,
        reservedStart: true,
        reservedEnd: true,
        status: true,
        calendarEventId: true,
        createdAt: true,
      },
      orderBy: {
        reservedStart: "desc",
      },
    });
    return reservations;
  } catch (error) {
    console.error("查詢預約記錄失敗:", error);
    return [];
  }
}

function formatDateTime(date: Date): string {
  // 轉換為台北時間（UTC+8）並格式化
  const d = new Date(date);
  
  // 使用 Intl.DateTimeFormat 轉換為台北時間
  const formatter = new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  
  const parts = formatter.formatToParts(d);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  const hour = parts.find((p) => p.type === "hour")?.value;
  const minute = parts.find((p) => p.type === "minute")?.value;
  
  // 友善格式：YYYY/MM/DD HH:mm
  return `${year}/${month}/${day} ${hour}:${minute}`;
}

function formatTimeRange(start: Date, end: Date): string {
  // 轉換為台北時間
  const startDate = new Date(start);
  const endDate = new Date(end);
  
  // 使用 Intl.DateTimeFormat 檢查是否為同一天（台北時間）
  const dateFormatter = new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  
  const timeFormatter = new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  
  const startDateStr = dateFormatter.format(startDate);
  const endDateStr = dateFormatter.format(endDate);
  const isSameDay = startDateStr === endDateStr;
  
  if (isSameDay) {
    // 同一天：只顯示一次日期，格式：YYYY/MM/DD HH:mm ~ HH:mm
    const dateStr = startDateStr.replace(/\//g, "/");
    const startTime = timeFormatter.format(startDate);
    const endTime = timeFormatter.format(endDate);
    return `${dateStr} ${startTime} ~ ${endTime}`;
  } else {
    // 不同天：顯示完整時間範圍
    const startStr = formatDateTime(start);
    const endStr = formatDateTime(end);
    return `${startStr} ~ ${endStr}`;
  }
}

interface PageProps {
  searchParams?: { status?: string };
}

export default async function ReservationsPage({ searchParams }: PageProps) {
  const currentStatus = ((searchParams?.status as StatusFilter) || "all") as StatusFilter;
  const reservations = await getReservations(currentStatus);

  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: "all", label: "全部" },
    { value: "PENDING", label: "PENDING" },
    { value: "CONFIRMED", label: "CONFIRMED" },
    { value: "CANCELLED", label: "CANCELLED" },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-orange-600 mb-6">
        早午餐預約列表
      </h1>

      {/* 狀態篩選按鈕組 */}
      <div className="flex gap-3 mb-6 flex-wrap">
        {statusOptions.map((option) => {
          const isActive = currentStatus === option.value;
          return (
            <Link
              key={option.value}
              href={
                option.value === "all"
                  ? "/admin/reservations"
                  : `/admin/reservations?status=${option.value}`
              }
              className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? "bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-warm"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-orange-50"
              }`}
            >
              {option.label}
            </Link>
          );
        })}
      </div>

      <p className="mb-6 text-gray-600 text-lg">
        總共 {reservations.length} 筆預約記錄
        {currentStatus !== "all" && `（${currentStatus}）`}
      </p>

      {reservations.length === 0 ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#999" }}>
          <p>目前尚無預約資料</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reservations.map((reservation) => (
            <div
              key={reservation.id}
              className="bg-white rounded-2xl p-6 shadow-warm hover:shadow-xl transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-orange-600">
                  {reservation.customerName}
                </h3>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    reservation.status === "CONFIRMED"
                      ? "bg-green-100 text-green-800"
                      : reservation.status === "PENDING"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {reservation.status === "CONFIRMED"
                    ? "已確認"
                    : reservation.status === "PENDING"
                    ? "待處理"
                    : "已取消"}
                </span>
              </div>
              <p className="text-gray-600 mb-2">
                時間：{formatTimeRange(
                  reservation.reservedStart,
                  reservation.reservedEnd
                )}
              </p>
              <p className="text-gray-600 mb-2">
                人數：{reservation.peopleCount} 人
              </p>
              <p className="text-gray-600 mt-3 text-sm">
                {reservation.calendarEventId ? (
                  <span className="text-green-600">✓ 已建立日曆</span>
                ) : (
                  <span className="text-gray-400">未建立日曆</span>
                )}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
