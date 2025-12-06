# Step B.5-1 完成報告 - 預約/座位儀表板骨架

## ✅ 已完成的工作

### A. 路由與選單

#### 1. 新增頁面檔案
- ✅ 已建立 `app/admin/booking-dashboard/page.tsx`
- ✅ 已建立 `app/admin/booking-dashboard/client.tsx`（Client Component 處理 URL 更新）

#### 2. 側邊選單更新
- ✅ 在 `app/admin/layout.tsx` 側邊選單新增「座位儀表板」項目
- ✅ 連結到 `/admin/booking-dashboard`

### B. 頁面架構與資料取得

#### 1. Server Component 架構
- ✅ `page.tsx` 為 Server Component
- ✅ 透過 `searchParams` 取得 `date` 和 `slotId`
- ✅ 使用 Prisma 在 server side 查詢 Reservation

#### 2. 查詢邏輯
- ✅ 使用與 `/reservation` 相同的 `toIsoFromDateAndSlot` 邏輯
- ✅ 將日期 + slot.start/end 轉換為 UTC 時間範圍
- ✅ Prisma 查詢條件：`reservedStart < slotEnd AND reservedEnd > slotStart`（查詢與時段有重疊的預約）
- ✅ 排序：`orderBy: { reservedStart: "asc" }`

#### 3. 聚合計算
- ✅ 使用 `reduce` 計算總人數：`totalPeople = sum(reservation.peopleCount)`
- ✅ 總座位數：`TOTAL_CAPACITY = 32`（硬編碼，固定配置：2人桌×4 + 4人桌×3 + 6人桌×2）

### C. UI 實作

#### 1. 上方控制列
- ✅ 日期選擇：`<input type="date">`，預設值為今天
- ✅ 時段選擇：使用與 `/reservation` 相同的 `TIME_SLOTS`，顯示 label
- ✅ 變更日期或時段時，更新 URL 的 query：`?date=YYYY-MM-DD&slotId=MORNING_1`
- ✅ 使用 Client Component 處理 URL 更新（`useRouter`）

#### 2. 中間 summary 區塊
- ✅ 顯示日期和時段：`2025/12/04 10:30–12:00`
- ✅ 顯示預約人數統計：`目前預約人數：10 / 32 位（約 31%）`
- ✅ 百分比計算：`Math.round((totalPeople / TOTAL_CAPACITY) * 100)`

#### 3. 下方預約列表
- ✅ 表格列出該日期 + 時段的 Reservation
- ✅ 欄位包含：
  - 姓名（customerName）
  - 人數（peopleCount）
  - 備註（notes，若無則顯示 "-"）
  - 狀態（PENDING/CONFIRMED/CANCELLED，帶顏色標籤）
- ✅ 表格可橫向 scroll（RWD 支援）

### D. 技術細節

#### 查詢邏輯說明
- 使用時間重疊查詢：`reservedStart < slotEnd AND reservedEnd > slotStart`
- 這樣可以找到所有與該時段有重疊的預約，而不是只找完全在時段內的預約

#### URL 參數處理
- 預設值：若無 query 參數，使用今天 + 第一個 slot（MORNING_1）
- URL 格式：`/admin/booking-dashboard?date=2025-12-04&slotId=MORNING_1`
- 使用 Next.js `useRouter` 更新 URL，觸發 Server Component 重新渲染

## 📋 功能說明

### 頁面結構
1. **頁面標題**：「座位儀表板」
2. **上方控制列**：
   - 日期選擇器（預設今天）
   - 時段下拉選單（4 個固定時段）
3. **中間 summary 區塊**：
   - 顯示選中的日期和時段
   - 顯示預約人數統計和百分比
4. **下方預約列表**：
   - 表格顯示所有符合條件的預約
   - 包含姓名、人數、備註、狀態

### 資料流程
1. 使用者選擇日期或時段
2. Client Component 更新 URL query 參數
3. Server Component 重新執行，根據新的 query 參數查詢資料
4. 顯示更新後的 summary 和預約列表

## 🧪 測試步驟

### 1. 建立測試資料
1. 使用前台 `/reservation` 表單建立不同日期 + 時段的預約
2. 例如：
   - 2025-12-05, 09:00–10:30, 2 人
   - 2025-12-05, 10:30–12:00, 4 人
   - 2025-12-06, 12:00–13:30, 3 人

### 2. 測試頁面功能
1. 前往：`/admin/booking-dashboard`
2. 確認：
   - 預設顯示今天 + 第一個時段（MORNING_1）
   - Summary 區塊顯示正確的日期和時段
   - 預約人數統計正確
   - 預約列表顯示符合條件的預約

### 3. 測試切換功能
1. 切換日期：
   - 選擇不同的日期
   - 確認 URL 更新為 `?date=YYYY-MM-DD&slotId=...`
   - 確認 summary 和列表更新

2. 切換時段：
   - 選擇不同的時段
   - 確認 URL 更新為 `?date=...&slotId=MORNING_2`
   - 確認 summary 和列表更新

### 4. 驗證計算
1. 確認總座位數固定為 32
2. 確認總人數計算正確（所有預約的 peopleCount 總和）
3. 確認百分比計算正確（四捨五入）

## 📊 回報給小明

### 頁面大致長相

**頁面結構（由上到下）：**
1. **頁面標題**：「座位儀表板」（20px，粗體）

2. **上方控制列**：
   - 日期選擇器（預設今天）
   - 時段下拉選單（4 個選項：09:00–10:30, 10:30–12:00, 12:00–13:30, 13:30–15:00）

3. **中間 summary 區塊**（灰色背景）：
   - 第一行：日期和時段（例如：`2025/12/04 10:30–12:00`）
   - 第二行：預約人數統計（例如：`目前預約人數：10 / 32 位（約 31%）`）

4. **下方預約列表**：
   - 標題：「預約列表」
   - 表格（可橫向滾動）：
     - 表頭：姓名 | 人數 | 備註 | 狀態
     - 資料列：每筆預約的詳細資訊

### 切換日期/時段時的行為

**URL 更新：**
- 選擇日期 → URL 變為 `/admin/booking-dashboard?date=2025-12-05&slotId=MORNING_1`
- 選擇時段 → URL 變為 `/admin/booking-dashboard?date=2025-12-05&slotId=MORNING_2`
- 同時更新兩個參數

**頁面更新：**
- Summary 區塊立即更新顯示新的日期和時段
- 預約人數統計重新計算並更新
- 預約列表重新查詢並顯示符合新條件的預約
- 若無符合條件的預約，顯示「目前尚無預約資料」

**重新整理：**
- 重新整理頁面後，URL 參數保持不變
- 頁面顯示與 URL 參數對應的資料

### Summary 顯示的格式

**格式範例：**
```
2025/12/04 10:30–12:00
目前預約人數：10 / 32 位（約 31%）
```

**說明：**
- 第一行：日期（YYYY/MM/DD 格式）+ 時段 label
- 第二行：`目前預約人數：{總人數} / {總座位數} 位（約 {百分比}%）`
- 百分比：四捨五入到整數
- 總座位數：固定為 32（2人桌×4 + 4人桌×3 + 6人桌×2）

## ✅ 驗證清單

- [x] 路由已建立（/admin/booking-dashboard）
- [x] 側邊選單已新增「座位儀表板」項目
- [x] 日期選擇器預設為今天
- [x] 時段選擇使用 TIME_SLOTS
- [x] URL query 參數正確更新
- [x] 資料查詢邏輯正確（時間重疊查詢）
- [x] 總人數計算正確
- [x] 總座位數固定為 32
- [x] 百分比計算正確（四捨五入）
- [x] Summary 區塊顯示格式正確
- [x] 預約列表顯示所有必要欄位
- [x] 表格可橫向滾動（RWD 支援）
- [x] 無語法錯誤（ESLint 通過）

Step B.5-1 已完成，預約/座位儀表板骨架已可正常使用！









