# Service Account 金鑰檔案說明

## 重要：請提供正確的 Service Account 金鑰

請將 `backend-core-user@localbiz-saas-core.iam.gserviceaccount.com` 的 Service Account 金鑰 JSON 檔案放置在此目錄，並命名為：

**`google-calendar-service-account.json`**

## 檔案位置

```
service-account/google-calendar-service-account.json
```

## 驗證方式

請確認 JSON 檔案中的 `client_email` 欄位為：
```
backend-core-user@localbiz-saas-core.iam.gserviceaccount.com
```

## 注意事項

- 此檔案包含敏感資訊，請勿提交到版本控制系統
- 確保 `.gitignore` 已包含此檔案路徑











