# Service Account 遷移總結

## ✅ 已完成的工作

### 1. 目錄結構建立
- ✅ 已建立 `service-account/` 目錄
- ✅ 已建立 `service-account/README.md` 說明文件
- ✅ 已更新 `.gitignore` 確保 Service Account 金鑰檔案不會被提交

### 2. 工具檔重寫
- ✅ `lib/googleCalendar.ts` - 已完全重寫為使用 Service Account
  - 使用 `googleapis` 套件的 JWT 認證
  - 從 `service-account/google-calendar-service-account.json` 讀取金鑰
  - 驗證 Service Account email 是否為目標帳號
  - 預設使用 `GOOGLE_CALENDAR_ID_BRUNCH` 行事曆

### 3. API Route 更新
- ✅ `app/api/google-calendar/create-event/route.ts` - 已更新
  - 使用 Service Account 版本的 `createGoogleCalendarEvent`
  - 錯誤處理和回應格式保持不變

### 4. 測試文件更新
- ✅ `docs/google-calendar-test.md` - 已更新為 Service Account 版本
  - 包含 PowerShell 和 cURL 測試指令
  - 預設使用 port 3000

### 5. 套件確認
- ✅ `googleapis@165.0.0` 已安裝，無需重新安裝

## ⚠️ 重要：需要 PM 提供的檔案

### Service Account 金鑰檔案

請將以下 Service Account 的金鑰 JSON 檔案放置到指定位置：

**目標 Service Account：**
```
backend-core-user@localbiz-saas-core.iam.gserviceaccount.com
```

**檔案路徑：**
```
service-account/google-calendar-service-account.json
```

**驗證方式：**
確認 JSON 檔案中的 `client_email` 欄位為：
```
backend-core-user@localbiz-saas-core.iam.gserviceaccount.com
```

## 📋 環境變數確認

已確認以下環境變數已設定：
- ✅ `GOOGLE_CALENDAR_ID_BRUNCH=43cf07ce5a94c83d80110b3c9cd29d32ac1a9aec7057c09c03aff94d16e04d40@group.calendar.google.com`

## 🧪 測試步驟

1. **確認 Service Account 金鑰檔案**
   - 確認 `service-account/google-calendar-service-account.json` 存在
   - 確認 `client_email` 為 `backend-core-user@localbiz-saas-core.iam.gserviceaccount.com`

2. **確認 Service Account 權限**
   - 確認 Service Account 對目標行事曆有寫入權限
   - 行事曆 ID：`43cf07ce5a94c83d80110b3c9cd29d32ac1a9aec7057c09c03aff94d16e04d40@group.calendar.google.com`

3. **啟動開發伺服器**
   ```bash
   npm run dev
   ```

4. **執行測試**
   - 使用 `docs/google-calendar-test.md` 中的 PowerShell 或 cURL 指令
   - 預設 port：3000

5. **驗證結果**
   - 檢查「SoloAI 早午餐預約」行事曆是否新增事件
   - 確認 API 回傳 200 狀態碼

## 📝 技術細節

### 實際使用的 Service Account 金鑰檔案路徑
```
service-account/google-calendar-service-account.json
```

### 程式碼調整
- 已移除 OAuth refresh token 相關程式碼
- 改用 `google.auth.JWT` 進行 Service Account 認證
- 使用 `google.calendar().events.insert()` 建立事件

### 額外調整
- Port 預設為 3000（與 Next.js 預設一致）
- 測試文件同時提供 PowerShell 和 cURL 指令
- 已加入 Service Account email 驗證機制（警告提示）

## 🔍 注意事項

1. **安全性**
   - Service Account 金鑰檔案已加入 `.gitignore`
   - 請勿將金鑰檔案提交到版本控制系統

2. **權限設定**
   - 確保 Service Account 對目標行事曆有寫入權限
   - 若權限不足，需要在 Google Cloud Console 中設定

3. **錯誤處理**
   - 若金鑰檔案不存在，會拋出明確的錯誤訊息
   - 若 Service Account email 不符預期，會顯示警告但不會中斷執行











