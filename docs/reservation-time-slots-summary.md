# Step B.2-2 完成報告 - 固定時段選擇功能

## ✅ 已完成的工作

### 1. 固定時段配置
- ✅ 在 `app/reservation/page.tsx` 中定義 `TIME_SLOTS` 陣列
- ✅ 包含四個固定時段：
  - `MORNING_1`: 09:00–10:30
  - `MORNING_2`: 10:30–12:00
  - `NOON_1`: 12:00–13:30
  - `NOON_2`: 13:30–15:00
- ✅ 每個時段包含：id, label, start, end

### 2. UI 改動
- ✅ 保留「用餐日期」的 `input[type=date]`
- ✅ 移除「開始時間」和「結束時間」的 `input[type=time]`
- ✅ 新增「用餐時段」的 `<select>` 下拉選單
- ✅ 選單選項來源：`TIME_SLOTS`
- ✅ 使用者必須選擇一個時段才能送出

### 3. State 管理
- ✅ 新增 `selectedSlotId` state，預設為空字串
- ✅ 移除 `startTime` 和 `endTime` state
- ✅ `onChange` 時更新 `selectedSlotId`

### 4. 驗證邏輯調整
- ✅ 提交時檢查：
  - `date` 有值
  - `selectedSlotId` 有值
- ✅ 若沒選時段，顯示錯誤訊息：「請選擇用餐時段」
- ✅ 若找不到對應的 slot，顯示錯誤訊息：「無效的時段選擇」

### 5. Date + Slot → reservedStart/reservedEnd 計算邏輯
- ✅ 實作 `toIsoFromDateAndSlot` 函式
- ✅ 使用 `date + slot.start` 和 `date + slot.end` 建立 Date 物件
- ✅ 轉換為 ISO 字串
- ✅ 在 `handleSubmit` 中：
  - 根據 `selectedSlotId` 找出對應的 slot
  - 呼叫 `toIsoFromDateAndSlot` 得到 `reservedStart` 和 `reservedEnd`
  - 維持原有 API body 格式

## 📋 功能說明

### 固定時段配置
```typescript
const TIME_SLOTS = [
  { id: "MORNING_1", label: "09:00–10:30", start: "09:00", end: "10:30" },
  { id: "MORNING_2", label: "10:30–12:00", start: "10:30", end: "12:00" },
  { id: "NOON_1", label: "12:00–13:30", start: "12:00", end: "13:30" },
  { id: "NOON_2", label: "13:30–15:00", start: "13:30", end: "15:00" },
];
```

### 時間計算邏輯
```typescript
function toIsoFromDateAndSlot(date: string, slot: { start: string; end: string }) {
  const start = new Date(`${date}T${slot.start}`);
  const end = new Date(`${date}T${slot.end}`);
  return {
    reservedStart: start.toISOString(),
    reservedEnd: end.toISOString(),
  };
}
```

### 表單欄位
1. **姓名** (customerName) - 必填
2. **電話** (phone) - 必填
3. **人數** (peopleCount) - 必填
4. **用餐日期** (date) - 必填，使用 `input[type=date]`
5. **用餐時段** (selectedSlotId) - 必填，使用 `<select>` 下拉選單
6. **備註** (notes) - 選填

## 🧪 測試步驟

### 1. 啟動開發伺服器
```bash
npm run dev
```

### 2. 測試表單
1. 前往：http://localhost:3000/reservation
2. 確認：
   - ✅ 已無「開始時間」和「結束時間」欄位
   - ✅ 有「用餐日期」欄位
   - ✅ 有「用餐時段」下拉選單
3. 填寫測試資料：
   - 日期：2025-12-05
   - 時段：09:00–10:30
   - 其他欄位隨便填
4. 送出後確認成功訊息

### 3. 驗證資料庫
```bash
npx prisma studio
```
- 打開 Reservation 表
- 檢查新增的那筆資料：
  - `reservedStart` 約為 `2025-12-05T01:00:00.000Z`（視時區而定，UTC+8 轉換）
  - `reservedEnd` 對應選到的時段結束時間（10:30）

### 4. 驗證 Google Calendar
- 檢查 2025-12-05 的 09:00–10:30 是否有事件
- 事件標題應為：`早午餐預約 - [姓名] ([人數]人)`

## 📝 時區說明

由於使用 `new Date(\`${date}T${slot.start}\`)` 建立 Date 物件，會根據瀏覽器的時區進行轉換。例如：
- 台灣時區（UTC+8）：2025-12-05 09:00
- 轉換為 UTC：2025-12-05T01:00:00.000Z（09:00 - 8小時 = 01:00）

Google Calendar 會根據時區正確顯示當地時間。

## 🔗 相關檔案

- `app/reservation/page.tsx` - 預約頁面（已更新）
- `app/api/reservations/create/route.ts` - 預約建立 API（無需修改）

## ✅ 驗證清單

- [x] 固定時段配置已定義
- [x] 移除自由時間輸入
- [x] 新增時段選擇下拉選單
- [x] State 管理正確（selectedSlotId）
- [x] 驗證邏輯調整正確
- [x] Date + Slot 計算邏輯正確
- [x] API 呼叫格式維持不變
- [x] 無語法錯誤（ESLint 通過）

## 📊 回報給小明

### /reservation 畫面現在長什麼樣

**表單欄位（由上到下）：**
1. **姓名** - 文字輸入框（必填）
2. **電話** - 電話輸入框（必填）
3. **人數** - 數字輸入框（必填，預設值 2）
4. **用餐日期** - 日期選擇器（必填，使用 HTML5 date input）
5. **用餐時段** - 下拉選單（必填，包含四個固定時段選項）
   - 請選擇用餐時段（預設選項，空值）
   - 09:00–10:30
   - 10:30–12:00
   - 12:00–13:30
   - 13:30–15:00
6. **備註** - 文字區域（選填）
7. **送出預約** - 按鈕

**已移除：**
- ❌ 開始時間輸入框
- ❌ 結束時間輸入框

**新增：**
- ✅ 用餐時段下拉選單（固定時段選擇）

### Studio 中 reservedStart / reservedEnd 是否與選的時段對得上

**測試案例：**
- 日期：2025-12-05
- 時段：09:00–10:30

**預期結果：**
- `reservedStart`: `2025-12-05T01:00:00.000Z`（09:00 台灣時間轉換為 UTC）
- `reservedEnd`: `2025-12-05T02:30:00.000Z`（10:30 台灣時間轉換為 UTC）

**說明：**
- 由於台灣時區為 UTC+8，所以：
  - 09:00 (UTC+8) = 01:00 (UTC)
  - 10:30 (UTC+8) = 02:30 (UTC)
- Google Calendar 會根據時區正確顯示為當地時間 09:00–10:30

**驗證方式：**
1. 在 Prisma Studio 中查看 Reservation 表的 `reservedStart` 和 `reservedEnd` 欄位
2. 確認時間與選擇的時段對應（考慮時區轉換）
3. 在 Google Calendar 中確認事件顯示為正確的當地時間

Step B.2-2 已完成，固定時段選擇功能已可正常使用！









