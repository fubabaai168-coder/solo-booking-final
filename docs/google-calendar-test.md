# Google Calendar API 測試指令（Service Account 版）

## PowerShell 測試指令

```powershell
Invoke-WebRequest `
  -Uri "http://localhost:3000/api/google-calendar/create-event" `
  -Method POST `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body '{"summary":"SoloAI 早午餐測試預約(Service Account)","description":"透過本機 API Route + Service Account 建立的測試事件","startDateTime":"2025-12-04T21:00:00+08:00","endDateTime":"2025-12-04T22:00:00+08:00"}'
```

## cURL 測試指令（適用於 Git Bash / WSL）

```bash
curl -X POST http://localhost:3000/api/google-calendar/create-event \
  -H "Content-Type: application/json" \
  -d '{
    "summary": "SoloAI 早午餐測試預約(Service Account)",
    "description": "透過本機 API Route + Service Account 建立的測試事件",
    "startDateTime": "2025-12-04T21:00:00+08:00",
    "endDateTime": "2025-12-04T22:00:00+08:00"
  }'
```

## 測試步驟

1. 確認 `service-account/google-calendar-service-account.json` 檔案存在且內容正確
2. 確認環境變數 `GOOGLE_CALENDAR_ID_BRUNCH` 已設定
3. 執行 `npm run dev` 啟動本機開發伺服器（預設 port 3000）
4. 在終端機執行上述 PowerShell 或 cURL 指令
5. 到「SoloAI 早午餐預約」行事曆檢查是否多一筆事件

## 預期回應

成功時會回傳：
```json
{
  "message": "事件建立成功",
  "eventId": "事件ID",
  "status": "confirmed",
  "htmlLink": "https://www.google.com/calendar/event?eid=..."
}
```

## 錯誤處理

若出現錯誤，API 會回傳：
```json
{
  "message": "建立 Google Calendar 事件失敗",
  "error": "錯誤訊息"
}
```

常見錯誤：
- Service Account 金鑰檔案不存在或路徑錯誤
- Service Account 沒有行事曆的寫入權限
- 環境變數 `GOOGLE_CALENDAR_ID_BRUNCH` 未設定
