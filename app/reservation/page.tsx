"use client";

import { useState } from "react";
import Link from "next/link";

// 時段選項
const timeSlots = [
  { value: "06:00-10:30", label: "06:00 - 10:30 早午餐" },
  { value: "11:30-14:00", label: "11:30 - 14:00 午餐" },
  { value: "14:00-17:00", label: "14:00 - 17:00 下午茶" },
  { value: "18:00-20:00", label: "18:00 - 20:00 晚餐" },
];

// TypeScript 型別定義
interface ReservationPayload {
  name: string;
  phone: string;
  date: string;
  time: string;
  people: number;
  notes?: string;
}

interface ApiResponse {
  success?: boolean;
  ok?: boolean;
  message?: string;
  error?: string;
}

export default function ReservationPage() {
  const [formData, setFormData] = useState<ReservationPayload>({
    name: "",
    phone: "",
    date: "",
    time: "",
    people: 1,
    notes: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "people" ? parseInt(value) || 1 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("=== 表單提交開始 ===");
    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    // 前端驗證
    if (!formData.name || !formData.phone || !formData.date || !formData.time) {
      setErrorMessage("請填寫所有必填欄位");
      setIsLoading(false);
      return;
    }

    const payload: ReservationPayload = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      date: formData.date,
      time: formData.time,
      people: formData.people || 1,
      notes: formData.notes?.trim() || "",
    };

    console.log("準備發送的資料：", payload);
    console.log("API 路徑：/api/reservation");

    try {
      const res = await fetch("/api/reservation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log("收到 API 回應，狀態碼：", res.status);

      let result: ApiResponse = {};
      try {
        result = await res.json();
        console.log("API 回應內容：", result);
      } catch (parseError) {
        console.error("解析 API 回應失敗：", parseError);
        setErrorMessage("伺服器回應格式錯誤，請稍後再試");
        setIsLoading(false);
        return;
      }

      // 處理成功回應（2xx 狀態碼且 success 為 true）
      if (res.ok && result.success) {
        setSuccessMessage(result.message || "預約成功！");
        // 清空表單
        setFormData({
          name: "",
          phone: "",
          date: "",
          time: "",
          people: 1,
          notes: "",
        });
      } else {
        // 處理失敗回應（非 2xx 或 success 為 false）
        const errorMsg = result.message || result.error || "預約失敗，請稍後再試";
        setErrorMessage(`預約失敗：${errorMsg}`);
        console.error("預約失敗：", errorMsg);
      }
    } catch (err: any) {
      console.error("送出失敗：", err);
      setErrorMessage(`預約失敗：${err.message || "網路錯誤，請再試一次"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* 頁面標題 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">餐廳預約</h1>
          <p className="text-lg text-gray-600">
            請填寫以下資訊，我們將為您安排最適合的用餐時段
          </p>
        </div>

        {/* 成功訊息 */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            <p className="font-semibold">✓ {successMessage}</p>
          </div>
        )}

        {/* 錯誤訊息 */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <p className="font-semibold">✗ {errorMessage}</p>
          </div>
        )}

        {/* 表單卡片 */}
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 姓名 */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                姓名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
                placeholder="請輸入您的姓名"
              />
            </div>

            {/* 電話 */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                電話 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
                placeholder="0912-345-678"
              />
            </div>

            {/* 日期 + 時段 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                  日期 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  required
                  value={formData.date}
                  onChange={handleChange}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
                />
              </div>

              <div>
                <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
                  時段 <span className="text-red-500">*</span>
                </label>
                <select
                  id="time"
                  name="time"
                  required
                  value={formData.time}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition bg-white"
                >
                  <option value="">請選擇時段</option>
                  {timeSlots.map((slot) => (
                    <option key={slot.value} value={slot.value}>
                      {slot.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 人數 */}
            <div>
              <label htmlFor="people" className="block text-sm font-medium text-gray-700 mb-2">
                人數 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="people"
                name="people"
                required
                min="1"
                value={formData.people}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
              />
            </div>

            {/* 備註 */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                特殊需求/備註
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition resize-none"
                placeholder="如有特殊需求或備註，請在此填寫（選填）"
              />
            </div>

            {/* 按鈕 */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-6 py-3 bg-amber-600 text-white font-semibold rounded-lg shadow-lg hover:bg-amber-700 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? "提交中..." : "提交預約"}
              </button>
              <Link
                href="/"
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 text-center transition-colors"
              >
                返回首頁
              </Link>
            </div>
          </form>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>我們會在收到您的預約後，盡快與您確認用餐時間。</p>
        </div>
      </div>
    </div>
  );
}
