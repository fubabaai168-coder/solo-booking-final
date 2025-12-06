# 環境變數設定指南

## 需要在 .env.local 中添加的環境變數

請確認以下環境變數已正確設定在 `.env.local` 文件中：

```env
# Google OAuth 2.0 設定（用於 Google Calendar API）
GOOGLE_OAUTH_CLIENT_ID=662486332332-0ifnunanq0aumdfv3iirfhml9tu37ujo.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=【你的 client secret】
GOOGLE_OAUTH_REFRESH_TOKEN=【Playground 拿到的 refresh_token】
GOOGLE_CALENDAR_ID_BRUNCH=43cf07ce5a94c83d80110b3c9cd29d32ac1a9aec7057c09c03aff94d16e04d40@group.calendar.google.com
```

## 重要說明

1. **GOOGLE_OAUTH_CLIENT_SECRET**: 請替換為你的 Google OAuth Client Secret
2. **GOOGLE_OAUTH_REFRESH_TOKEN**: 請從 Google OAuth Playground 獲取 refresh_token 並填入
3. **GOOGLE_CALENDAR_ID_BRUNCH**: 這是早午餐專用行事曆的 ID，已設定完成

## 注意事項

- 程式不再使用 primary calendar，一律使用 `GOOGLE_CALENDAR_ID_BRUNCH`
- 確保所有環境變數都已正確設定，否則 API 會回傳錯誤











