# Google Calendar API 實作總結

## ✅ 已完成的工作

### 1. 環境變數設定
- ✅ 已在 `.env.local` 中添加以下環境變數：
  - `GOOGLE_OAUTH_CLIENT_ID` (已設定)
  - `GOOGLE_OAUTH_CLIENT_SECRET` (需填入你的 client secret)
  - `GOOGLE_OAUTH_REFRESH_TOKEN` (需填入 Playground 拿到的 refresh_token)
  - `GOOGLE_CALENDAR_ID_BRUNCH` (已設定)

### 2. 工具檔建立
- ✅ `lib/googleCalendar.ts` - Google Calendar API 包裝工具
  - 實作 `getGoogleAccessToken()` - 使用 refresh token 換取 access token
  - 實作 `createGoogleCalendarEvent()` - 建立行事曆事件
  - 使用 OAuth 2.0 refresh token 機制
  - 預設使用 `GOOGLE_CALENDAR_ID_BRUNCH` 行事曆

### 3. API Route 建立
- ✅ `app/api/google-calendar/create-event/route.ts`
  - POST 端點：`/api/google-calendar/create-event`
  - 接收 JSON 請求體：`summary`, `description`, `startDateTime`, `endDateTime`, `calendarId` (可選)
  - 回傳事件資訊：`eventId`, `status`, `htmlLink`

### 4. 測試文件
- ✅ `docs/google-calendar-test.md` - 包含 cURL 測試指令

## 📝 下一步操作

### 1. 填入環境變數
請在 `.env.local` 中填入以下值：
- `GOOGLE_OAUTH_CLIENT_SECRET` - 你的 Google OAuth Client Secret
- `GOOGLE_OAUTH_REFRESH_TOKEN` - 從 Google OAuth Playground 獲取的 refresh_token

### 2. 測試 API
1. 啟動開發伺服器：`npm run dev`
2. 執行測試指令（見 `docs/google-calendar-test.md`）：
   ```bash
   curl -X POST http://localhost:3000/api/google-calendar/create-event \
     -H "Content-Type: application/json" \
     -d '{
       "summary": "SoloAI 早午餐測試預約",
       "description": "透過本機 API Route 建立的測試事件",
       "startDateTime": "2025-12-04T21:00:00+08:00",
       "endDateTime": "2025-12-04T22:00:00+08:00"
     }'
   ```
3. 檢查「SoloAI 早午餐預約」行事曆是否新增事件

## 🔍 重要說明

- 程式不再使用 primary calendar，一律使用 `GOOGLE_CALENDAR_ID_BRUNCH`
- 所有敏感資料從 `process.env.*` 取得，無硬編碼
- API Route 使用 Node.js runtime（非 Edge）
- 錯誤處理已實作，會回傳適當的 HTTP 狀態碼和錯誤訊息











