# Step B.2-1 完成報告 - 預約列表狀態篩選功能

## ✅ 已完成的工作

### 1. URL Query String 設計
- ✅ 使用 query string 表示當前篩選狀態
- ✅ `/admin/reservations` → 等於 `status=all`（顯示全部）
- ✅ `/admin/reservations?status=CONFIRMED` → 只顯示 CONFIRMED 狀態
- ✅ `/admin/reservations?status=PENDING` → 只顯示 PENDING 狀態
- ✅ `/admin/reservations?status=CANCELLED` → 只顯示 CANCELLED 狀態

### 2. Server Component 參數處理
- ✅ 修改 `page.tsx` 接收 `searchParams` 參數
- ✅ 使用 `searchParams?.status` 讀取當前篩選狀態
- ✅ 預設值為 "all"（顯示全部）

### 3. Prisma 查詢邏輯
- ✅ 根據 `searchParams.status` 動態設定 `where` 條件
- ✅ 若為 "all" 或未提供 → 不加 `where.status` 條件（顯示全部）
- ✅ 若為 PENDING / CONFIRMED / CANCELLED → 加上對應的 `where: { status: "..." }`
- ✅ 仍然以 `reservedStart` DESC 排序

### 4. UI 狀態篩選按鈕組
- ✅ 在頁面上方新增狀態切換按鈕組
- ✅ 包含四個選項：
  - **全部**：連結到 `/admin/reservations`
  - **PENDING**：連結到 `/admin/reservations?status=PENDING`
  - **CONFIRMED**：連結到 `/admin/reservations?status=CONFIRMED`
  - **CANCELLED**：連結到 `/admin/reservations?status=CANCELLED`
- ✅ 使用 Next.js `Link` 組件更新 URL
- ✅ 當前選中的按鈕有明顯的視覺區別（橙色背景、白色文字、粗體）

### 5. 頁面顯示優化
- ✅ 總筆數顯示會根據篩選狀態更新
- ✅ 當篩選特定狀態時，總筆數後會顯示狀態名稱，例如：「總共 5 筆預約記錄（CONFIRMED）」
- ✅ 表格只顯示符合篩選條件的資料

## 🎨 UI 設計

### 狀態篩選按鈕組
- **位置**：頁面標題下方，總筆數上方
- **樣式**：
  - 未選中：白色背景、黑色文字、灰色邊框
  - 選中：橙色背景（#f97316）、白色文字、粗體
  - 按鈕間距：8px
  - 響應式：可換行顯示

### 按鈕狀態指示
- 一眼就能看出當前選中的狀態（橙色高亮）
- 點擊按鈕會更新 URL，並重新載入頁面顯示篩選結果

## 🧪 測試步驟

### 1. 準備測試資料
1. 使用前台 `/reservation` 送出幾筆預約（預設狀態為 CONFIRMED）
2. 使用 Prisma Studio 手動修改 1-2 筆為 PENDING 或 CANCELLED：
   ```bash
   npx prisma studio
   ```
   - 打開 Reservation 表
   - 選擇幾筆記錄，將 status 改為 PENDING 或 CANCELLED

### 2. 測試篩選功能
1. 啟動開發伺服器：`npm run dev`
2. 前往 `/admin/reservations`：
   - 預設應該看到「全部」按鈕被選中（橙色）
   - 應該看到所有預約資料
3. 點擊「CONFIRMED」按鈕：
   - URL 變為 `/admin/reservations?status=CONFIRMED`
   - 只顯示 status=CONFIRMED 的預約
   - 「CONFIRMED」按鈕變為橙色（選中狀態）
4. 點擊「PENDING」按鈕：
   - URL 變為 `/admin/reservations?status=PENDING`
   - 只顯示 status=PENDING 的預約
   - 「PENDING」按鈕變為橙色（選中狀態）
5. 點擊「全部」按鈕：
   - URL 變為 `/admin/reservations`
   - 顯示所有預約資料
   - 「全部」按鈕變為橙色（選中狀態）

### 3. 驗證 URL 持久化
1. 選擇「CONFIRMED」篩選
2. 重新整理頁面（F5）
3. 確認：
   - URL 保持為 `/admin/reservations?status=CONFIRMED`
   - 篩選狀態保持一致（只顯示 CONFIRMED 的預約）
   - 「CONFIRMED」按鈕仍然被選中

## 📋 功能說明

### 篩選邏輯
1. **全部**（預設）：
   - URL：`/admin/reservations`
   - Prisma 查詢：不加 `where.status` 條件
   - 顯示：所有預約

2. **PENDING**：
   - URL：`/admin/reservations?status=PENDING`
   - Prisma 查詢：`where: { status: "PENDING" }`
   - 顯示：只顯示 PENDING 狀態的預約

3. **CONFIRMED**：
   - URL：`/admin/reservations?status=CONFIRMED`
   - Prisma 查詢：`where: { status: "CONFIRMED" }`
   - 顯示：只顯示 CONFIRMED 狀態的預約

4. **CANCELLED**：
   - URL：`/admin/reservations?status=CANCELLED`
   - Prisma 查詢：`where: { status: "CANCELLED" }`
   - 顯示：只顯示 CANCELLED 狀態的預約

### 資料排序
- 所有篩選結果都依 `reservedStart` DESC 排序（最新的預約在最上面）

## 🔗 相關檔案

- `app/admin/reservations/page.tsx` - 預約列表頁面（已更新）
- `lib/prisma.ts` - Prisma Client 實例

## ✅ 驗證清單

- [x] URL query string 設計正確
- [x] Server Component 正確接收 searchParams
- [x] Prisma 查詢邏輯正確（根據狀態篩選）
- [x] 狀態篩選按鈕組已新增
- [x] 按鈕樣式清楚顯示當前選中狀態
- [x] 點擊按鈕會更新 URL
- [x] 重新整理頁面後篩選狀態保持一致
- [x] 表格只顯示符合篩選條件的資料
- [x] 總筆數顯示正確
- [x] 無語法錯誤（ESLint 通過）

## 📊 回報給小明

### 有哪些按鈕 / 篩選選項
頁面上方有四個狀態篩選按鈕：
1. **全部** - 顯示所有預約（預設選中）
2. **PENDING** - 只顯示待確認的預約
3. **CONFIRMED** - 只顯示已確認的預約
4. **CANCELLED** - 只顯示已取消的預約

### 切換後列表如何變化
- **視覺變化**：
  - 當前選中的按鈕會變成橙色背景、白色文字、粗體
  - 其他按鈕保持白色背景、黑色文字

- **URL 變化**：
  - 點擊「全部」→ URL 變為 `/admin/reservations`
  - 點擊「PENDING」→ URL 變為 `/admin/reservations?status=PENDING`
  - 點擊「CONFIRMED」→ URL 變為 `/admin/reservations?status=CONFIRMED`
  - 點擊「CANCELLED」→ URL 變為 `/admin/reservations?status=CANCELLED`

- **列表內容變化**：
  - 表格只顯示符合當前篩選狀態的預約
  - 總筆數會更新為符合條件的筆數
  - 例如：選擇「CONFIRMED」時，總筆數顯示「總共 X 筆預約記錄（CONFIRMED）」

- **持久化**：
  - 重新整理頁面後，篩選狀態會保持（因為 URL 中有 query string）
  - 選中的按鈕狀態也會保持

Step B.2-1 已完成，狀態篩選功能已可正常使用！









