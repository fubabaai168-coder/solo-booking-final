// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
// import AIChatButton from "@/components/AIChatButton"; // 舊的 Gemini 客服 widget，已停用
import { SupportChatWidget } from "@/components/support/SupportChatWidget";

export const metadata: Metadata = {
  title: "SoloAI 官方網站 | AI 行銷 × 智慧轉型",
  description:
    "協助在地商家用 AI 提升行銷、客服、網站與曝光力，打造『曝光 → 互動 → 收件 → 轉換』閉環。",
  keywords: [
    "AI 行銷",
    "在地商家",
    "網站架設",
    "AI 客服",
    "預約系統",
    "智慧轉型",
  ],
  openGraph: {
    title: "SoloAI 官方網站",
    description:
      "AI 行銷 × 智慧轉型，助你業績起飛。提供 AI 行銷代管、網站架設、客服與預約系統服務。",
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
      </body>
    </html>
  );
}
