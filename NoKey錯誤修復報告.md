# 🔧 "No key or keyFile set" 錯誤修復報告

## 📋 錯誤分析

### 錯誤訊息
```
Error: No key or keyFile set.
    at GoogleToken.eval (webpack-internal:///(rsc)/./node_modules/gtoken/build/cjs/src/index.cjs:299:17)
    ...
    at POST (webpack-internal:///(rsc)/./app/api/reservation/route.ts:70:20)
```

### 錯誤位置
- **發生位置：** `app/api/reservation/route.ts:81`（`auth.authorize()` 調用時）
- **錯誤類型：** JWT 認證初始化失敗
- **根本原因：** JWT 構造函式未正確接收私鑰參數

### 關鍵觀察

從終端機日誌中發現：

1. **環境變數狀態：** ✅ 全部已設定
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`: 已設定
   - `GOOGLE_SERVICE_ACCOUNT_KEY`: 已設定（1704 字符）
   - `是否包含換行符: 是` ✅
   - `是否包含 \n 字串: 否` ✅

2. **問題根源：**
   - JWT 構造函式使用參數列表方式初始化時，在 Next.js webpack 打包環境中可能無法正確接收私鑰
   - 錯誤發生在 `auth.authorize()` 調用時，表示 JWT 內部無法找到私鑰

---

## ✅ 已實施的修復

### 修復內容

**位置：** `app/api/reservation/route.ts` 第 66-94 行

**修復前（參數列表方式）：**
```typescript
const auth = new (google.auth.JWT as any)(
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  undefined,
  privateKey,
  [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/calendar",
  ]
);
```

**修復後（配置物件方式）：**
```typescript
const auth = new (google.auth.JWT as any)({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: privateKey,
  scopes: [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/calendar",
  ],
});
```

**修復說明：**
1. **改用配置物件方式初始化 JWT**：更可靠，避免參數傳遞問題
2. **添加詳細調試日誌**：確認 `privateKey` 的狀態（長度、類型、開頭字符）
3. **添加驗證檢查**：確保 `privateKey` 不為空且格式正確

### 新增的調試資訊

```typescript
console.log("🔑 私鑰處理檢查:");
console.log("  privateKey 長度:", privateKey.length);
console.log("  privateKey 是否為空:", privateKey.length === 0 ? "是" : "否");
console.log("  privateKey 類型:", typeof privateKey);
console.log("  privateKey 前 50 字符:", privateKey.substring(0, 50));
console.log("  privateKey 是否以 BEGIN 開頭:", privateKey.trim().startsWith('-----BEGIN'));
```

---

## 🔍 技術細節

### JWT 初始化方式比較

#### 方式 1：參數列表（修復前）
```typescript
new google.auth.JWT(
  email,
  keyFilePath,
  key,
  scopes
)
```
- **問題：** 在 Next.js webpack 環境中，參數可能無法正確傳遞
- **適用場景：** 簡單的 Node.js 環境

#### 方式 2：配置物件（修復後）✅
```typescript
new google.auth.JWT({
  email: email,
  key: key,
  scopes: scopes
})
```
- **優點：** 更明確，避免參數順序問題
- **適用場景：** Next.js、webpack 打包環境

---

## 🧪 測試步驟

### 步驟 1：確認修復已應用

1. **重新啟動開發伺服器**（如果正在運行）
2. **確認程式碼已更新**

### 步驟 2：提交測試預約單

1. 訪問：`http://localhost:3000/reservation`
2. 填寫表單並提交

### 步驟 3：檢查終端機日誌

**成功時應看到：**
```
🔐 開始 Google 身份驗證...
📋 環境變數讀取檢查:
  GOOGLE_SERVICE_ACCOUNT_EMAIL: places-api-service@...
  GOOGLE_SERVICE_ACCOUNT_KEY:
    長度: 1704 字符
    是否包含換行符: 是
🔑 私鑰處理檢查:
  privateKey 長度: 1704
  privateKey 是否為空: 否
  privateKey 類型: string
  privateKey 前 50 字符: -----BEGIN PRIVATE KEY-----
  privateKey 是否以 BEGIN 開頭: true
🔑 獲取 Google API access token...
✅ Google API 認證成功
📊 初始化 Google Sheets API...
📅 初始化 Google Calendar API...
⏰ 處理日期和時間...
📅 創建 Google 日曆事件...
✅ 日曆事件創建成功: https://calendar.google.com/...
📊 寫入 Google Sheets...
✅ Google Sheets 寫入成功
✅ 預約成功完成
```

**如果仍然失敗，檢查：**
1. 是否看到 `privateKey 是否以 BEGIN 開頭: true`
2. 如果為 `false`，表示私鑰格式不正確
3. 檢查 `privateKey 類型` 是否為 `string`
4. 檢查完整的錯誤日誌

---

## 📝 修復摘要

| 項目 | 狀態 | 說明 |
|------|------|------|
| 環境變數設定 | ✅ 已確認 | 所有環境變數都已設定 |
| 金鑰格式 | ✅ 正確 | 已包含實際換行符 |
| JWT 初始化方式 | ✅ 已修復 | 改用配置物件方式 |
| 調試日誌 | ✅ 已添加 | 詳細的私鑰狀態檢查 |
| 驗證檢查 | ✅ 已添加 | 確保私鑰不為空且格式正確 |

---

## 🎯 下一步

1. **重新啟動開發伺服器**
2. **測試預約功能**
3. **檢查終端機日誌**，確認：
   - `privateKey 是否以 BEGIN 開頭: true`
   - `✅ Google API 認證成功`
4. **如果仍然失敗：**
   - 檢查完整的調試日誌輸出
   - 確認私鑰格式是否正確
   - 確認服務帳號權限是否已正確設定

---

**修復完成時間：** 2025-01-15
**修復內容：** 
1. 改用配置物件方式初始化 JWT
2. 添加詳細的調試日誌
3. 添加私鑰驗證檢查










