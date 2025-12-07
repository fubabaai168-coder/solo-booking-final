// app/layout.tsx
import type { Metadata } from "next";
import Script from "next/script";
import { Suspense } from "react";
import "./globals.css";
// import AIChatButton from "@/components/AIChatButton"; // 舊的 Gemini 客服 widget，已停用
import { SupportChatWidget } from "@/components/support/SupportChatWidget";
import { AnalyticsTracker } from "./_components/AnalyticsTracker";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export const metadata: Metadata = {
  title: "微光暖食｜AI 智能預約系統",
  description:
    "預約管理 × 座位儀表板 × Google 日曆同步。微光暖食專屬的智能預約系統。",
  keywords: [
    "AI 行銷",
    "在地商家",
    "網站架設",
    "AI 客服",
    "預約系統",
    "智慧轉型",
  ],
  openGraph: {
    title: "微光暖食｜AI 智能預約系統",
    description:
      "預約管理 × 座位儀表板 × Google 日曆同步。微光暖食專屬的智能預約系統。",
    url: "https://soloai.shop",
    siteName: "SoloAI",
    images: [{ url: "/og-image.jpg" }],
    locale: "zh_TW",
    type: "website",
  },
  metadataBase: new URL("https://soloai.shop"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant-TW">
      <body className="bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 min-h-screen">
        {/* Navbar 已暫時移除 */}
        <main style={{ minHeight: "70vh" }}>{children}</main>
        <footer
          style={{
            padding: "40px 16px",
            textAlign: "center",
            fontSize: 14,
            opacity: 0.7,
          }}
        >
          © {new Date().getFullYear()} SoloAI. All rights reserved.
        </footer>
        {/* 新的中文客服聊天組件 */}
        <SupportChatWidget />
        {/* 舊的 AI 客服聊天組件（已停用） */}
        {/* <AIChatButton /> */}

        {/* Google Analytics 4 */}
        {process.env.NODE_ENV === "production" && GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
            <Suspense fallback={null}>
              <AnalyticsTracker />
            </Suspense>
          </>
        )}
      </body>
    </html>
  );
}
