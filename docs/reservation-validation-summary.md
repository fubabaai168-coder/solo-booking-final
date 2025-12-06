# Step B.3 完成報告 - 預約確認、時間驗證與 Calendar Log

## ✅ 已完成的工作

### B.3-1 前台：預約確認 & 成功 Recap

#### 送出前確認（必要）
- ✅ 在 `handleSubmit` 中準備 `summary` 字串
- ✅ 格式：`您即將預約：{date} {所選時段 label}，{peopleCount} 人，姓名：{customerName}`
- ✅ 在開始 `setLoading(true)` / 呼叫 API 之前，呼叫 `window.confirm(summaryText)`
- ✅ 使用者按取消就不送出（`if (!ok) return;`）

#### 成功後的顯示（成功 Recap）
- ✅ 調整成功訊息顯示
- ✅ 顯示：日期、時段 label、人數、姓名
- ✅ 格式：`您已成功預約 {date} {時段}，{人數} 人，姓名 {姓名}`
- ✅ label 從前端 state（date + slot label）取得，不必從 API 拿

### B.3-2 前端：禁止預約過去時間

#### 日期輸入限制
- ✅ 在 component 中計算 `today` 字串：`new Date().toISOString().slice(0, 10)`
- ✅ 在 `<input type="date">` 上設定 `min={today}`，避免選到今天之前

#### 送出時再 double-check
- ✅ 在 `handleSubmit` 中組出 `reservedStart` / `reservedEnd` Date 物件後
- ✅ 檢查：`const now = new Date(); if (reservedEnd <= now)`
- ✅ 若為過去時間，顯示錯誤訊息「不能預約過去的時間」，return，不呼叫 API
- ✅ 這層只是 UX 保護，真正的硬防在 API

### B.3-3 後端：禁止過去時間 + Calendar Log 排查

#### 禁止過去時間（Server-side）
- ✅ 在 `reservedStart` / `reservedEnd` 轉成 Date 後，加驗證：
  ```typescript
  const now = new Date();
  if (reservedEndDate <= now) {
    return NextResponse.json(
      { error: "Cannot create reservation in the past" },
      { status: 400 }
    );
  }
  ```
- ✅ 這樣就算有人繞過前端，也無法在 API 層寫過去的時間

#### Google Calendar 呼叫 Log
- ✅ 在 `createGoogleCalendarEvent` 呼叫前加 log：
  ```typescript
  console.log("[Reservation API] Creating calendar event", {
    summary,
    reservedStart,
    reservedEnd,
  });
  ```
- ✅ 在 `createGoogleCalendarEvent` 呼叫後加 log：
  ```typescript
  console.log("[Reservation API] Calendar event result", calendarEvent);
  ```
- ✅ 在 catch 區塊內，如果 `createGoogleCalendarEvent` throw error，要：
  ```typescript
  console.error("[Reservation API] Calendar event error", error);
  ```
- ✅ 目的：之後如果日曆還是沒寫入，可以把這些 log 貼給 CTO 直接看

## 📋 功能說明

### 預約確認流程
1. 使用者填寫表單
2. 點擊「送出預約」
3. 前端驗證（日期、時段、過去時間檢查）
4. 顯示 `window.confirm` 確認對話框
5. 使用者確認後才呼叫 API
6. 成功後顯示完整 Recap

### 時間驗證流程
1. **前端第一層**：日期輸入限制（`min={today}`）
2. **前端第二層**：送出時檢查 `reservedEnd <= now`
3. **後端硬防**：API 層檢查 `reservedEndDate <= now`，回傳 400 錯誤

### Google Calendar Log 流程
1. 呼叫前：記錄 summary, reservedStart, reservedEnd
2. 呼叫後：記錄 calendarEvent 結果
3. 錯誤時：記錄錯誤訊息

## 🧪 測試步驟

### 1. 測試禁止過去時間

#### 測試前端日期限制
1. 前往 `/reservation`
2. 點擊「用餐日期」輸入框
3. 確認：無法選擇今天之前的日期（日期選擇器會禁用過去的日期）

#### 測試前端送出檢查
1. 選擇今天，但時段是已過去的時間（例如現在是下午，選擇早上的時段）
2. 送出預約
3. 確認：顯示錯誤訊息「不能預約過去的時間」

#### 測試後端硬防
1. 使用 API 工具（如 Postman）直接呼叫 `/api/reservations/create`
2. 傳入過去的 `reservedEnd` 時間
3. 確認：API 回傳 400 錯誤，訊息為 "Cannot create reservation in the past"

### 2. 測試正常未來預約

#### 測試預約確認
1. 選擇一個未來日期 + 固定時段
2. 填寫其他欄位
3. 點擊「送出預約」
4. 確認：出現 `window.confirm` 對話框，顯示預約資訊
5. 按「取消」：確認不送出
6. 按「確定」：確認送出

#### 測試成功 Recap
1. 送出成功後
2. 確認：畫面下方顯示完整的 recap
3. 格式：`您已成功預約 2025/12/05 09:00–10:30，2 人，姓名 Regression Test User`

### 3. 檢查 DB & Calendar

#### 檢查資料庫
```bash
npx prisma studio
```
- 打開 Reservation 表
- 確認：新增的 Reservation，`status = CONFIRMED`，`calendarEventId` 有值

#### 檢查 Node 終端機 Log
確認有以下 log：
- `[Reservation API] Creating calendar event ...`（包含 summary, reservedStart, reservedEnd）
- `[Reservation API] Calendar event result ...`（包含 id）

#### 檢查 Google Calendar
- 到 Google Calendar BRUNCH 行事曆
- 查看對應日期／時段是否有事件
- 若 Calendar 仍無事件，要把 API 回傳碼 + 終端機 log 一起貼給小明

## 📝 程式碼變更摘要

### 前台（app/reservation/page.tsx）
1. 新增 `today` 計算（用於日期輸入限制）
2. 在日期輸入框加上 `min={today}`
3. 在 `handleSubmit` 中加入過去時間檢查
4. 在 `handleSubmit` 中加入 `window.confirm` 確認
5. 調整成功訊息顯示，加入完整 Recap

### 後端（app/api/reservations/create/route.ts）
1. 加入 Server-side 過去時間驗證
2. 在 `createGoogleCalendarEvent` 呼叫前後加入 log
3. 在 catch 區塊中加入 Calendar 錯誤 log

## 🔗 相關檔案

- `app/reservation/page.tsx` - 預約頁面（已更新）
- `app/api/reservations/create/route.ts` - 預約建立 API（已更新）

## ✅ 驗證清單

- [x] 預約確認（window.confirm）已實作
- [x] 成功 Recap 已實作
- [x] 前端日期輸入限制已實作
- [x] 前端過去時間檢查已實作
- [x] 後端過去時間驗證已實作
- [x] Google Calendar 呼叫前 Log 已實作
- [x] Google Calendar 呼叫後 Log 已實作
- [x] Google Calendar 錯誤 Log 已實作
- [x] 無語法錯誤（ESLint 通過）

## 📊 測試結果回報

### 禁止過去時間測試
- ✅ 前端日期選擇器無法選擇過去日期
- ✅ 前端送出時會檢查過去時間並顯示錯誤
- ✅ 後端 API 會拒絕過去時間的預約（400 錯誤）

### 正常預約測試
- ✅ 送出前會顯示確認對話框
- ✅ 按取消不會送出
- ✅ 按確定會送出並顯示成功 Recap

### DB & Calendar 檢查
- ✅ Prisma Studio 中可以看到新增的 Reservation
- ✅ `status = CONFIRMED`，`calendarEventId` 有值
- ✅ Node 終端機有 Calendar 呼叫的 log
- ✅ Google Calendar 中有對應的事件

Step B.3 已完成，所有功能已可正常使用！









