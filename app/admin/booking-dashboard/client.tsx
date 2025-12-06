"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import type { TableUsage } from "@/lib/seatConfig";

interface TimeSlot {
  id: string;
  label: string;
  start: string;
  end: string;
}

interface Reservation {
  id: string;
  customerName: string;
  peopleCount: number;
  notes: string | null;
  status: string;
  reservedStart: Date;
  reservedEnd: Date;
}

interface BookingDashboardClientProps {
  timeSlots: TimeSlot[];
  selectedDate: string;
  selectedSlotId: string;
  reservations: Reservation[];
  totalPeople: number;
  totalCapacity: number;
  percentage: number;
  selectedSlotLabel: string;
  tableUsages: TableUsage[];
}

function formatDateForDisplay(dateStr: string): string {
  return dateStr.replace(/-/g, "/");
}

export default function BookingDashboardClient({
  timeSlots,
  selectedDate: initialDate,
  selectedSlotId: initialSlotId,
  reservations,
  totalPeople,
  totalCapacity,
  percentage,
  selectedSlotLabel,
  tableUsages,
}: BookingDashboardClientProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedSlotId, setSelectedSlotId] = useState(initialSlotId);

  // 當 URL 參數改變時，更新本地狀態
  useEffect(() => {
    setSelectedDate(initialDate);
    setSelectedSlotId(initialSlotId);
  }, [initialDate, initialSlotId]);

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    updateURL(newDate, selectedSlotId);
  }

  function handleSlotChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newSlotId = e.target.value;
    setSelectedSlotId(newSlotId);
    updateURL(selectedDate, newSlotId);
  }

  function updateURL(date: string, slotId: string) {
    const url = new URL(window.location.href);
    url.searchParams.set("date", date);
    url.searchParams.set("slotId", slotId);
    router.push(url.toString());
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-orange-600 mb-6">
        座位儀表板
      </h1>

      {/* 上方控制列 */}
      <div
        style={{
          display: "flex",
          gap: "16px",
          marginBottom: "24px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div>
          <label style={{ display: "block", marginBottom: "4px", fontSize: "14px" }}>
            日期
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            style={{
              padding: "8px",
              fontSize: "14px",
              border: "1px solid #ddd",
              borderRadius: "4px",
            }}
          />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: "4px", fontSize: "14px" }}>
            時段
          </label>
          <select
            value={selectedSlotId}
            onChange={handleSlotChange}
            style={{
              padding: "8px",
              fontSize: "14px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              minWidth: "150px",
            }}
          >
            {timeSlots.map((slot) => (
              <option key={slot.id} value={slot.id}>
                {slot.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 中間 summary 區塊 */}
      <div className="bg-white rounded-2xl p-6 shadow-warm mb-6">
        <p className="text-xl font-bold text-orange-600 mb-2">
          {formatDateForDisplay(selectedDate)} {selectedSlotLabel}
        </p>
        <p className="text-lg text-gray-700">
          目前預約人數：<span className="font-bold text-orange-600">{totalPeople}</span> / {totalCapacity} 位（約 {percentage}%）
        </p>
      </div>

      {/* 座位概況區塊 */}
      <div className="bg-white rounded-2xl p-6 shadow-warm mb-6">
        <h2 className="text-xl font-bold text-orange-600 mb-3">
          座位概況
        </h2>
        <p className="text-gray-600 mb-4">
          目前預計使用中的桌數會以顏色標示。
        </p>

        {/* Legend */}
        <div className="flex items-center gap-6 mb-6">
          <div className="flex items-center gap-2">
            <span className="inline-block h-4 w-4 rounded bg-gradient-to-br from-orange-400 to-orange-600" />
            <span className="text-sm font-medium">使用中</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-4 w-4 rounded bg-gray-200" />
            <span className="text-sm font-medium text-gray-600">空桌</span>
          </div>
        </div>

        {/* 桌子 Grid */}
        <div className="grid grid-cols-3 md:grid-cols-4 gap-8">
          {tableUsages.map((t) => (
            <div
              key={t.id}
              className={`aspect-square rounded-2xl flex flex-col items-center justify-center text-white font-bold text-xl shadow-warm ${
                t.used
                  ? "bg-gradient-to-br from-orange-400 to-orange-600"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              <span>{t.label}</span>
              {t.used && <span className="text-sm mt-2">已預約</span>}
            </div>
          ))}
        </div>
      </div>

      {/* 下方預約列表 */}
      <div>
        <h2 className="text-xl font-bold text-orange-600 mb-4">
          預約列表
        </h2>
        {reservations.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-gray-500">
            <p className="text-lg">此日期與時段尚無預約</p>
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
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
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
                  人數：{reservation.peopleCount} 人
                </p>
                {reservation.notes && (
                  <p className="text-gray-600 mt-3 text-sm">
                    備註：{reservation.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

