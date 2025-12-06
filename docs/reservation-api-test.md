# Reservation API 測試文件

## API 端點

**POST** `/api/reservations/create`

## 請求格式

### Headers
```
Content-Type: application/json
```

### Request Body
```json
{
  "customerName": "張三",
  "phone": "0912345678",
  "peopleCount": 2,
  "reservedStart": "2025-12-10T12:00:00+08:00",
  "reservedEnd": "2025-12-10T14:00:00+08:00",
  "notes": "靠窗座位"
}
```

### 必填欄位
- `customerName` (string): 顧客姓名
- `phone` (string): 電話號碼
- `peopleCount` (number | string): 人數
- `reservedStart` (string): 開始時間（ISO 8601 格式）
- `reservedEnd` (string): 結束時間（ISO 8601 格式）

### 選填欄位
- `notes` (string): 備註

## 測試指令

### PowerShell
```powershell
Invoke-WebRequest `
  -Uri "http://localhost:3000/api/reservations/create" `
  -Method POST `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body '{"customerName":"張三","phone":"0912345678","peopleCount":2,"reservedStart":"2025-12-10T12:00:00+08:00","reservedEnd":"2025-12-10T14:00:00+08:00","notes":"靠窗座位"}'
```

### cURL
```bash
curl -X POST http://localhost:3000/api/reservations/create \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "張三",
    "phone": "0912345678",
    "peopleCount": 2,
    "reservedStart": "2025-12-10T12:00:00+08:00",
    "reservedEnd": "2025-12-10T14:00:00+08:00",
    "notes": "靠窗座位"
  }'
```

## 成功回應

```json
{
  "message": "Reservation created and Calendar event created successfully",
  "reservation": {
    "id": "clx...",
    "customerName": "張三",
    "phone": "0912345678",
    "peopleCount": 2,
    "reservedStart": "2025-12-10T04:00:00.000Z",
    "reservedEnd": "2025-12-10T06:00:00.000Z",
    "status": "CONFIRMED",
    "calendarEventId": "google_calendar_event_id",
    "notes": "靠窗座位",
    "createdAt": "2025-12-04T01:20:00.000Z",
    "updatedAt": "2025-12-04T01:20:00.000Z"
  },
  "calendarEvent": {
    "id": "google_calendar_event_id",
    "status": "confirmed",
    "htmlLink": "https://www.google.com/calendar/event?eid=..."
  }
}
```

## 錯誤回應

### 400 Bad Request - 缺少必填欄位
```json
{
  "error": "Missing required fields. Required: customerName, phone, peopleCount, reservedStart, reservedEnd"
}
```

### 400 Bad Request - 無效的人數
```json
{
  "error": "Invalid peopleCount"
}
```

### 400 Bad Request - 無效的時間格式
```json
{
  "error": "Invalid reservedStart or reservedEnd. Expect ISO datetime string."
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## 功能流程

1. **驗證請求資料** - 檢查必填欄位和資料格式
2. **建立 Reservation** - 在 SQLite 資料庫中建立預約記錄（狀態：PENDING）
3. **建立 Google Calendar 事件** - 呼叫 `createGoogleCalendarEvent` 建立行事曆事件
4. **更新 Reservation** - 將 `calendarEventId` 寫回資料庫，並將狀態改為 `CONFIRMED`
5. **回傳結果** - 回傳預約資料和行事曆事件資訊

## 注意事項

- 確保 `RESERVATION_DATABASE_URL` 環境變數已正確設定
- 確保 `GOOGLE_CALENDAR_ID_BRUNCH` 環境變數已正確設定
- 確保 Service Account 金鑰檔案存在於 `service-account/google-calendar-service-account.json`
- 時間格式必須為 ISO 8601 格式（例如：`2025-12-10T12:00:00+08:00`）










