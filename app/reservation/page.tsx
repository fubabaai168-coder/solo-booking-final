// app/reservation/page.tsx

"use client";

import { FormEvent, useState, useEffect } from "react";

type ApiResponse =
  | {
      message: string;
      reservation: {
        id: string;
        customerName: string;
        // 其他欄位略
      };
      calendarEvent: {
        id?: string;
        htmlLink?: string;
        // 其他欄位略
      };
      submittedData?: {
        date: string;
        selectedSlotId: string;
        peopleCount: number;
        customerName: string;
      };
    }
  | {
      error: string;
    };

import { TIME_SLOTS } from "@/lib/timeSlots";

function toIsoFromDateAndSlot(date: string, slot: { start: string; end: string }) {
  const start = new Date(`${date}T${slot.start}`);
  const end = new Date(`${date}T${slot.end}`);
  return {
    reservedStart: start.toISOString(),
    reservedEnd: end.toISOString(),
  };
}

export default function ReservationPage() {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [peopleCount, setPeopleCount] = useState(2);
  const [date, setDate] = useState("");
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);

  // 計算今天日期字串（YYYY-MM-DD）
  const today = new Date().toISOString().slice(0, 10);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setResult(null);

    // 驗證邏輯調整
    if (!date) {
      setResult({ error: "請選擇用餐日期" });
      return;
    }

    if (!selectedSlotId) {
      setResult({ error: "請選擇用餐時段" });
      return;
    }

    // 依 selectedSlotId 找出對應的 slot
    const slot = TIME_SLOTS.find((s) => s.id === selectedSlotId);
    if (!slot) {
      setResult({ error: "無效的時段選擇" });
      return;
    }

    // 使用 date + slot 計算 reservedStart / reservedEnd
    const { reservedStart, reservedEnd } = toIsoFromDateAndSlot(date, slot);

    // 送出時再 double-check：禁止預約過去時間
    const now = new Date();
    const reservedEndDate = new Date(reservedEnd);
    if (reservedEndDate <= now) {
      setResult({ error: "不能預約過去的時間" });
      return;
    }

    // 準備確認資訊 summary
    const summaryText = `您即將預約：${date} ${slot.label}，${peopleCount} 人，姓名：${customerName}`;
    
    // 送出前確認（必要）
    const ok = window.confirm(summaryText);
    if (!ok) return; // 使用者按取消就不送出

    // 保存提交的資料，用於顯示 recap（在清空表單後仍能顯示）
    const submittedData = {
      date,
      selectedSlotId,
      peopleCount,
      customerName,
    };

    setLoading(true);
    try {
      const res = await fetch("/api/reservations/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          phone,
          peopleCount,
          reservedStart,
          reservedEnd,
          notes,
        }),
      });

      const data = (await res.json()) as ApiResponse;

      if (!res.ok) {
        setResult(
          "error" in data
            ? data
            : { error: "建立預約時發生錯誤，請稍後再試。" }
        );
      } else {
        // 將提交的資料附加到 result 中，用於顯示 recap
        const resultWithSubmittedData = {
          ...data,
          submittedData,
        };
        setResult(resultWithSubmittedData);
        
        // 重置表單 state
        setCustomerName("");
        setPhone("");
        setPeopleCount(2);
        setDate("");
        setSelectedSlotId("");
        setNotes("");
      }
    } catch (error) {
      console.error("Create reservation failed", error);
      setResult({ error: "系統錯誤，請稍後再試。" });
    } finally {
      setLoading(false);
    }
  }

  // 格式化日期顯示（YYYY-MM-DD -> YYYY/MM/DD）
  function formatDateForDisplay(dateStr: string): string {
    return dateStr.replace(/-/g, "/");
  }

  return (
    <div style={{ maxWidth: 640, margin: "20px auto", padding: "0 16px" }}>
      <h1 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "16px" }}>
        早午餐預約
      </h1>
      <p style={{ marginBottom: "24px", fontSize: "14px" }}>
        請填寫以下資料，我們會為您建立預約與日曆行程。
      </p>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "12px" }}>
        <div>
          <label style={{ fontSize: "14px", display: "block" }}>
            姓名 *
            <input
              type="text"
              name="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
              style={{ width: "100%", padding: "8px", marginTop: "4px", fontSize: "14px", boxSizing: "border-box" }}
            />
          </label>
        </div>

        <div>
          <label style={{ fontSize: "14px", display: "block" }}>
            電話 *
            <input
              type="tel"
              name="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              style={{ width: "100%", padding: "8px", marginTop: "4px", fontSize: "14px", boxSizing: "border-box" }}
            />
          </label>
        </div>

        <div>
          <label style={{ fontSize: "14px", display: "block" }}>
            人數 *
            <select
              name="peopleCount"
              value={peopleCount}
              onChange={(e) => setPeopleCount(Number(e.target.value))}
              required
              style={{ width: "100%", padding: "8px", marginTop: "4px", fontSize: "14px", boxSizing: "border-box" }}
            >
              {Array.from({ length: 9 }, (_, i) => i + 1).map((num) => (
                <option key={num} value={num}>
                  {num} 人
                </option>
              ))}
            </select>
          </label>
        </div>

        <div>
          <label style={{ fontSize: "14px", display: "block" }}>
            用餐日期 *
            <input
              type="date"
              name="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={today}
              required
              style={{ width: "100%", padding: "8px", marginTop: "4px", fontSize: "14px", boxSizing: "border-box" }}
            />
          </label>
        </div>

        <div>
          <label style={{ fontSize: "14px", display: "block" }}>
            用餐時段 *
            <select
              name="selectedSlotId"
              value={selectedSlotId}
              onChange={(e) => setSelectedSlotId(e.target.value)}
              required
              style={{ width: "100%", padding: "8px", marginTop: "4px", fontSize: "14px", boxSizing: "border-box" }}
            >
              <option value="">請選擇用餐時段</option>
              {TIME_SLOTS.map((slot) => (
                <option key={slot.id} value={slot.id}>
                  {slot.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div>
          <label style={{ fontSize: "14px", display: "block" }}>
            備註
            <textarea
              name="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              style={{ width: "100%", padding: "8px", marginTop: "4px", fontSize: "14px", boxSizing: "border-box" }}
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: "12px",
            padding: "12px 16px",
            backgroundColor: "#f97316",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "default" : "pointer",
            fontSize: "16px",
            width: "100%",
            fontWeight: 600,
          }}
        >
          {loading ? "送出中..." : "送出預約"}
        </button>
      </form>

      {result && "error" in result && (
        <div style={{ marginTop: "16px", color: "red", fontSize: "14px" }}>
          {result.error}
        </div>
      )}

      {result && "message" in result && (
        <div style={{ marginTop: "16px", color: "green", fontSize: "14px" }}>
          <p>{result.message}</p>
          {result.reservation && (
            <>
              <p style={{ marginTop: "8px" }}>預約編號：{result.reservation.id}</p>
              {/* 成功 Recap：顯示日期、時段、人數、姓名 */}
              {result.submittedData && (() => {
                const { date: submittedDate, selectedSlotId: submittedSlotId, peopleCount: submittedPeopleCount, customerName: submittedCustomerName } = result.submittedData;
                const slot = TIME_SLOTS.find((s) => s.id === submittedSlotId);
                return (
                  <p style={{ marginTop: "8px", fontWeight: 600 }}>
                    您已成功預約 {formatDateForDisplay(submittedDate)} {slot?.label}，{submittedPeopleCount} 人，姓名 {submittedCustomerName}
                  </p>
                );
              })()}
            </>
          )}
        </div>
      )}
    </div>
  );
}
