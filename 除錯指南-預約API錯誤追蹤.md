# 預約 API 錯誤追蹤除錯指南

## 🔍 已增強錯誤日誌輸出

我已經增強了 `/api/reservation` 路由的錯誤日誌輸出，現在會顯示：

1. **詳細的執行流程日誌**（每個步驟都會記錄）
2. **完整的錯誤堆疊追蹤**（Stack Trace）
3. **環境變數檢查**（確認哪些變數已設定/未設定）
4. **錯誤物件的完整內容**

---

## 📋 如何查看終端機錯誤日誌

### 步驟 1：確認開發伺服器正在運行

開發伺服器應該在終端機中運行，顯示類似以下的訊息：

```bash
> soloai-website@0.1.0 dev
> next dev

  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000
  - Ready in X.XXs
```

### 步驟 2：重現錯誤

1. **開啟瀏覽器**，訪問：`http://localhost:3000/reservation`
2. **填寫預約表單**（填寫所有必填欄位）
3. **點擊「提交預約」按鈕**
4. **立即查看終端機**（運行 `npm run dev` 的窗口）

### 步驟 3：查看終端機輸出

當錯誤發生時，終端機會顯示類似以下的詳細日誌：

#### ✅ 成功流程的日誌範例：

```
📝 收到預約請求
📋 接收到的資料: {
  "name": "測試用戶",
  "phone": "0912345678",
  "date": "2025-01-15",
  "time": "11:30 - 14:00 午餐",
  "guests": 2,
  "notes": "靠窗座位"
}
🔐 開始 Google 身份驗證...
📊 初始化 Google Sheets API...
📅 初始化 Google Calendar API...
⏰ 處理日期和時間...
   解析時段: 11:30 - 14:00 午餐 -> 11:30 到 14:00
   開始時間: 2025-01-15T11:30:00
   結束時間: 2025-01-15T14:00:00
   ISO 開始時間: 2025-01-15T03:30:00.000Z
   ISO 結束時間: 2025-01-15T06:00:00.000Z
📅 創建 Google 日曆事件...
   日曆 ID: your-calendar-id@group.calendar.google.com
   活動標題: [Brunch 預約] 測試用戶 (2人)
✅ 日曆事件創建成功: https://calendar.google.com/calendar/event?eid=...
📊 寫入 Google Sheets...
   試算表 ID: your-spreadsheet-id
   工作表名稱: Brunch_Reservations
   寫入資料: [["測試用戶","0912345678","2025-01-15","11:30 - 14:00 午餐","2","靠窗座位","https://calendar.google.com/calendar/event?eid=...","2025/1/15 下午3:30:00"]]
✅ Google Sheets 寫入成功
✅ 預約成功完成
```

#### ❌ 錯誤流程的日誌範例：

```
📝 收到預約請求
📋 接收到的資料: {
  "name": "測試用戶",
  "phone": "0912345678",
  "date": "2025-01-15",
  "time": "11:30 - 14:00 午餐",
  "guests": 2,
  "notes": "靠窗座位"
}
🔐 開始 Google 身份驗證...
❌ 預約寫入失敗:
錯誤訊息: Invalid JWT: Token must be a short-lived token (60 minutes) and in a reasonable timeframe
錯誤堆疊: Error: Invalid JWT: Token must be a short-lived token (60 minutes) and in a reasonable timeframe
    at JWTClient.requestAsync (node_modules/google-auth-library/build/src/auth/jwtclient.js:XXX:XX)
    at process.processTicksAndRejections (node:internal/process/task_queues.js:XX:XX)
    ...
完整錯誤物件: {
  "message": "Invalid JWT: Token must be a short-lived token (60 minutes) and in a reasonable timeframe",
  "code": "invalid_grant",
  ...
}
環境變數檢查:
  GOOGLE_SHEETS_ID: 已設定
  GOOGLE_CALENDAR_ID: 已設定
  GOOGLE_SERVICE_ACCOUNT_EMAIL: 已設定
  GOOGLE_SERVICE_ACCOUNT_KEY: ❌ 未設定
```

---

## 🔧 常見錯誤類型及解決方法

### 錯誤 1：環境變數未設定

**終端機顯示：**
```
環境變數檢查:
  GOOGLE_SHEETS_ID: ❌ 未設定
  GOOGLE_SERVICE_ACCOUNT_KEY: ❌ 未設定
```

**解決方法：**
1. 確認 `.env.local` 或 `.env` 檔案存在
2. 確認所有必要的環境變數都已設定
3. 重新啟動開發伺服器（`npm run dev`）

### 錯誤 2：Google 身份驗證失敗

**終端機顯示：**
```
錯誤訊息: Invalid JWT: Token must be a short-lived token...
```

**可能原因：**
- `GOOGLE_SERVICE_ACCOUNT_KEY` 格式不正確
- 服務帳號私鑰已過期或無效
- 時鐘不同步

**解決方法：**
1. 確認 `GOOGLE_SERVICE_ACCOUNT_KEY` 是完整的 JSON 字串
2. 確認私鑰包含換行符（`\n`）
3. 重新生成服務帳號金鑰

### 錯誤 3：Google Sheets 權限錯誤

**終端機顯示：**
```
錯誤訊息: The caller does not have permission
```

**解決方法：**
1. 確認服務帳號 Email 已分享試算表權限
2. 確認服務帳號有「編輯者」權限

### 錯誤 4：Google Calendar 權限錯誤

**終端機顯示：**
```
錯誤訊息: Calendar not found
```

**解決方法：**
1. 確認 `GOOGLE_CALENDAR_ID` 正確
2. 確認服務帳號有權限在該日曆中創建活動
3. 確認日曆 ID 格式正確（通常是 Email 地址）

### 錯誤 5：時段解析失敗

**終端機顯示：**
```
錯誤訊息: 無法解析時段格式: 11:30-14:00
```

**解決方法：**
1. 確認前端傳送的 `time` 格式正確
2. 確認時段格式符合正則表達式：`(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})`

---

## 📸 如何截圖終端機輸出

### Windows PowerShell / CMD

1. 在終端機中，**選取錯誤訊息文字**
2. 按 `Ctrl + C` 複製
3. 貼到文字編輯器或直接回報

### Windows Terminal

1. 右鍵點擊終端機標題列
2. 選擇「標記」或「選取」
3. 選取錯誤訊息區域
4. 按 `Enter` 複製
5. 貼到文字編輯器或直接回報

### 截圖方式

1. 使用 `Win + Shift + S`（Windows 截圖工具）
2. 選取終端機視窗的錯誤區域
3. 儲存截圖並回報

---

## 🎯 測試步驟

1. **確認開發伺服器正在運行**
   ```bash
   cd soloai-website
   npm run dev
   ```

2. **開啟瀏覽器**，訪問預約頁面

3. **填寫並提交表單**

4. **立即查看終端機**，複製或截圖所有錯誤訊息

5. **將錯誤訊息貼給我**，我會協助分析問題

---

## 📝 錯誤回報格式

請提供以下資訊：

1. **終端機完整錯誤輸出**（文字或截圖）
2. **錯誤發生的時間點**（在哪個步驟失敗）
3. **環境變數檢查結果**（哪些變數未設定）
4. **瀏覽器 Console 錯誤**（如果有）

---

**現在請重現錯誤，並將終端機的完整錯誤訊息貼給我！** 🔍










