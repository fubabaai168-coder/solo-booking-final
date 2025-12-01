"use client";

import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <main className="min-h-screen bg-white">
      {/* 導覽列 (Navigation Bar) */}
      <nav className="sticky top-0 bg-white shadow-md z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo/店名 */}
            <Link href="/" className="text-2xl font-bold text-amber-600">
            SoloAI 測試首頁 123
              Modern Brunch Place
            </Link>

            {/* 桌面版導覽選單 */}
            <div className="hidden md:flex items-center gap-8">
              <Link
                href="#menu"
                className="text-gray-700 hover:text-amber-600 transition-colors"
              >
                菜單
              </Link>
              <Link
                href="/reservation"
                className="text-gray-700 hover:text-amber-600 transition-colors"
              >
                預約
              </Link>
              <Link
                href="#about"
                className="text-gray-700 hover:text-amber-600 transition-colors"
              >
                關於我們
              </Link>
            </div>

            {/* 行動版選單按鈕 */}
            <button
              className="md:hidden text-gray-700 focus:outline-none"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="切換選單"
            >
              {isMenuOpen ? (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>

          {/* 行動版下拉選單 */}
          {isMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-gray-200">
              <div className="flex flex-col gap-4 pt-4">
                <Link
                  href="#menu"
                  className="text-gray-700 hover:text-amber-600 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  菜單
                </Link>
                <Link
                  href="/reservation"
                  className="text-gray-700 hover:text-amber-600 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  預約
                </Link>
                <Link
                  href="#about"
                  className="text-gray-700 hover:text-amber-600 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  關於我們
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* 主視覺區 (Hero Section) */}
      <section className="pt-16 pb-32 px-6 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            極致早午餐體驗
            <br />
            <span className="text-amber-600">AI 智能預約</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-2xl mx-auto">
            享受精緻美食，體驗智能預約的便利。讓 AI 為您安排最完美的用餐時光。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/reservation"
              className="px-8 py-4 bg-amber-600 text-white text-lg font-semibold rounded-lg shadow-lg hover:bg-amber-700 transform hover:scale-105 transition-all duration-200"
            >
              立即預約
            </Link>
            <Link
              href="#menu"
              className="px-8 py-4 bg-white text-amber-600 text-lg font-semibold rounded-lg shadow-lg border-2 border-amber-600 hover:bg-amber-50 transform hover:scale-105 transition-all duration-200"
            >
              查看菜單
            </Link>
          </div>
        </div>
      </section>

      {/* 特色區 (Features) */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            為什麼選擇我們？
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-xl hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-amber-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">智能預約</h3>
              <p className="text-gray-600">
                AI 智能系統自動為您安排最佳用餐時段，節省等待時間
              </p>
            </div>
            <div className="text-center p-6 rounded-xl hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-amber-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">精緻美食</h3>
              <p className="text-gray-600">
                嚴選新鮮食材，精心烹調每一道料理，帶給您最美好的味覺體驗
              </p>
            </div>
            <div className="text-center p-6 rounded-xl hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-amber-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">舒適環境</h3>
              <p className="text-gray-600">
                溫馨舒適的用餐空間，讓您放鬆身心，享受美好的用餐時光
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 菜單預覽區 (Menu Preview) */}
      <section id="menu" className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            精選菜單
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: "經典班尼迪克蛋", price: "NT$ 280" },
              { name: "法式吐司組合", price: "NT$ 320" },
              { name: "美式早午餐盤", price: "NT$ 350" },
              { name: "煙燻鮭魚三明治", price: "NT$ 290" },
              { name: "義式烘蛋", price: "NT$ 310" },
              { name: "鬆餅套餐", price: "NT$ 280" },
            ].map((item, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="h-48 bg-gradient-to-br from-amber-200 to-orange-200 rounded-lg mb-4"></div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {item.name}
                </h3>
                <p className="text-amber-600 font-semibold text-lg">
                  {item.price}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 關於我們區 (About) */}
      <section id="about" className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">關於我們</h2>
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            Modern Brunch Place 致力於提供最優質的早午餐體驗。我們結合傳統料理技藝與現代科技，
            透過 AI 智能預約系統，讓每一位客人都能享受最便利、最舒適的用餐服務。
          </p>
          <p className="text-lg text-gray-600 leading-relaxed">
            無論是週末的悠閒時光，還是平日的快速用餐，我們都準備好為您服務。
          </p>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 px-6 bg-gradient-to-r from-amber-600 to-orange-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">準備好享受美好的早午餐了嗎？</h2>
          <p className="text-xl mb-8 opacity-90">
            立即預約，讓我們為您安排最完美的用餐體驗
          </p>
          <Link
            href="/reservation"
            className="inline-block px-8 py-4 bg-white text-amber-600 text-lg font-semibold rounded-lg shadow-lg hover:bg-gray-100 transform hover:scale-105 transition-all duration-200"
          >
            立即預約
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 bg-gray-900 text-gray-400 text-center">
        <p className="mb-2">© {new Date().getFullYear()} Modern Brunch Place. All rights reserved.</p>
        <p className="text-sm">地址：台北市信義區 | 電話：(02) 1234-5678</p>
      </footer>
    </main>
  );
}
