# 【微光暖食成果展專案狀態卡 v2.0】
### Micro Light Warm Food Exhibition Project Status Card v2.0
### (中英對照，永久保存版 / Bilingual, Permanent Archive Version)

---

**專案名稱 / Project Name**：微光暖食 – 12/10 成果展 AI 早午餐預約系統  
**Micro Light Warm Food – 12/10 Exhibition AI Brunch Reservation System**

**系統總設計師 (CTO) / Chief Technology Officer**：SoloAI

**最後更新 / Last Updated**：2025-12-05 (已完成全部前端優化與後台選單擴充)  
**(All frontend optimizations and admin menu expansions completed)**

---

## 1. 核心路由與狀態 / Core Routes & Status

| 網址 / URL | 顯示內容 / Display Content | 檔案位置 / File Location | 狀態 / Status | 備註 / Notes |
| :--- | :--- | :--- | :--- | :--- |
| `/` | → 自動導到 /landing<br/>→ Auto redirect to /landing | `middleware.ts` | ✅ 正常 / Normal | 公開訪問入口 / Public access entry |
| `/landing` | 微光暖食超美首頁<br/>Beautiful Landing Page | `app/landing/page.tsx` | ✅ **完美 / Perfect** | 具備 Navbar, Menu (6項), About, Info<br/>Includes Navbar, Menu (6 items), About, Info |
| `/reservation` | 完整預約表單<br/>Complete Reservation Form | `app/reservation/page.tsx` | ✅ **功能已擴充 / Enhanced** | 已加入手機版「一鍵加到 Google 日曆」按鈕<br/>Added mobile "Add to Google Calendar" button |
| `/admin/*` | 後台管理 (儀表板、座位)<br/>Admin Dashboard (Dashboard, Seating) | `app/admin/**` | ✅ **UI已優化 / UI Optimized** | Active State 選單樣式已實作<br/>Active State menu styling implemented |
| `/admin/menu` | 菜單管理介面<br/>Menu Management Interface | `app/admin/menu/page.tsx` | ⏳ **待實作 / To Be Implemented** | 選單已加入，需補上功能頁面<br/>Menu item added, needs functional page |

---

## 2. 前台視覺與功能 / Frontend Visual & Features

以下項目已全部完成，符合米其林等級的視覺要求：  
**All items below are completed, meeting Michelin-level visual standards:**

### ✅ 已完成項目 / Completed Items

* ✅ **結構 / Structure**：Landing Page (一頁式錨點滾動) 結構正確  
  Landing Page (one-page anchor scrolling) structure is correct

* ✅ **Navbar/Icon**：導覽列固定，Icon 已替換為精緻調性  
  Fixed navigation bar, Icons replaced with refined style

* ✅ **菜單 / Menu**：六項菜單數據已加入，圖片顯示正常，圖文順序正確  
  Six menu items added, images display correctly, text/image order is correct

* ✅ **動態效果 / Animations**：Hero 區塊及菜單卡片加入 `framer-motion` 動畫  
  Hero section and menu cards include `framer-motion` animations

* ✅ **客服 / Customer Service**：右下角「微光小助手」聊天泡泡已加入  
  Bottom-right "Micro Light Assistant" chat bubble added

* ✅ **數據 / Data**：商家資訊已更新為：高雄市前鎮區復興四路 2 號四樓之一  
  Business information updated to: 4F-1, No. 2, Fuxing 4th Road, Qianzhen District, Kaohsiung City

---

## 3. 後續擴充清單 / Next Priority List

| 優先順序<br/>Priority | 任務 / Task | 負責人 / Responsible | 備註 / Notes |
| :--- | :--- | :--- | :--- |
| **1.** | 實作 `/admin/menu` 頁面內容<br/>Implement `/admin/menu` page content | CTO (前端 / Frontend) | 頁面應具備：菜單名稱、價格、圖片上傳及 CRUD 表單<br/>Page should include: menu name, price, image upload, and CRUD forms |
| **2.** | 定義「菜單管理」後端 API 需求<br/>Define "Menu Management" backend API requirements | CTO (前端) → 後端 GPT<br/>Frontend → Backend GPT | 需定義 `/api/admin/menu/*` 的 RESTful API 規格<br/>Need to define RESTful API specifications for `/api/admin/menu/*` |
| **3.** | 串接 `/reservation` 表單至 SaaS 後端<br/>Connect `/reservation` form to SaaS backend | 後端 GPT<br/>Backend GPT | 最終目標：確保表單數據可以寫入資料庫<br/>Final goal: Ensure form data can be written to database |

---

## 4. 緊急復原方式 / Emergency Recovery SOP

### Windows PowerShell

```powershell
# 重啟並清除緩存（用於解決本地開發環境的暫存問題）
# Restart and clear cache (for resolving local development environment cache issues)

# 刪除建置快取和依賴
# Delete build cache and dependencies
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue

# 重新安裝依賴
# Reinstall dependencies
npm install

# 啟動開發伺服器
# Start development server
npm run dev
```

### Linux / macOS

```bash
# 重啟並清除緩存（用於解決本地開發環境的暫存問題）
# Restart and clear cache (for resolving local development environment cache issues)

# 刪除建置快取和依賴
# Delete build cache and dependencies
rm -rf .next node_modules

# 重新安裝依賴
# Reinstall dependencies
npm install

# 啟動開發伺服器
# Start development server
npm run dev
```

---

## 5. 技術架構摘要 / Technical Architecture Summary

### 前端技術棧 / Frontend Tech Stack
- **框架 / Framework**: Next.js 14 (App Router)
- **語言 / Language**: TypeScript
- **樣式 / Styling**: Tailwind CSS
- **動畫 / Animations**: Framer Motion
- **圖標 / Icons**: Lucide React

### 後端技術棧 / Backend Tech Stack
- **資料庫 / Database**: SQLite (via Prisma ORM)
- **API 路由 / API Routes**: Next.js API Routes
- **ORM**: Prisma

### 主要功能模組 / Main Feature Modules
- ✅ 預約系統 / Reservation System
- ✅ 座位管理 / Seat Management
- ✅ 客服機器人 / Customer Service Bot
- ✅ 菜單展示 / Menu Display
- ⏳ 菜單管理 / Menu Management (待實作 / To Be Implemented)

---

## 6. 重要檔案清單 / Important Files List

### 核心檔案 / Core Files
- `app/landing/page.tsx` - 首頁 / Landing Page
- `app/reservation/page.tsx` - 預約表單 / Reservation Form
- `app/admin/AdminLayoutClientShell.tsx` - 後台布局 / Admin Layout
- `middleware.ts` - 路由中間件 / Route Middleware
- `prisma/schema.prisma` - 資料庫結構 / Database Schema

### 組件檔案 / Component Files
- `components/support/SupportChatWidget.tsx` - 客服聊天組件 / Support Chat Widget
- `app/admin/support-bot/page.tsx` - 客服機器人管理 / Support Bot Management

---

## 7. 部署注意事項 / Deployment Notes

### 環境變數 / Environment Variables
- 確保 `.env` 檔案包含必要的資料庫連接字串  
  Ensure `.env` file contains necessary database connection strings

### Prisma 遷移 / Prisma Migrations
```bash
# 生成 Prisma Client
# Generate Prisma Client
npx prisma generate

# 執行資料庫遷移（如需要）
# Run database migrations (if needed)
npx prisma migrate dev
```

---

**文件版本 / Document Version**: v2.0  
**維護者 / Maintainer**: SoloAI CTO  
**最後審核 / Last Review**: 2025-12-05

---

*此文件為專案永久保存版本，請定期更新以反映最新狀態。*  
*This document is a permanent archive version of the project. Please update regularly to reflect the latest status.*







