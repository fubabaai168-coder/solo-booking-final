# SoloAI API 驗證與部署錯誤日誌

> **文件目的：** 記錄 SoloAI 專案開發過程中遇到的關鍵錯誤與最終解決方案，供未來專案維護和新開發者參考。

**最後更新：** 2025-01-15  
**專案版本：** Next.js 14.2.3

---

## 📋 目錄

1. [Git / 環境部署錯誤](#1-git--環境部署錯誤-vercel--nextjs)
2. [Google 認證 / API 連線錯誤](#2-google-認證--api-連線錯誤-401--500)
3. [路由與文件錯誤](#3-路由與文件錯誤-404--build-fail)

---

## 1. Git / 環境部署錯誤 (Vercel / Next.js)

### 1.1 Git Merge 衝突錯誤

#### 錯誤訊息
```
fatal: You are in the middle of a merge
error: failed to push some refs to 'origin/main'
```

#### 問題原因
- Git 倉庫處於合併狀態，但合併未完成
- 本地有未提交的變更，無法推送到遠端

#### 解決方案

**步驟 1：檢查 Git 狀態**
```bash
cd soloai-website
git status
```

**步驟 2：完成合併或取消合併**
```bash
# 如果合併已完成，提交變更
git commit -m "chore: resolve merge conflicts"

# 如果不想合併，取消合併
git merge --abort
```

**步驟 3：推送到遠端**
```bash
git push origin main
```

**完整流程範例：**
```bash
cd soloai-website
git status                    # 確認狀態
git add .                     # 加入所有變更
git commit -m "chore: update cache control config"
git push origin main          # 推送到 GitHub
```

---

### 1.2 Vercel Root Directory 設定錯誤

#### 錯誤訊息
```
The specified Root Directory "soloai-website" does not exist
Build Error: Could not find a production build
```

#### 問題原因
- Vercel 專案設定中的 Root Directory 指向了不存在的路徑
- 專案結構中，`soloai-website` 是子資料夾，但 Vercel 嘗試在根目錄尋找

#### 解決方案

**在 Vercel 專案設定中：**

1. 進入 Vercel Dashboard
2. 選擇專案 → **Settings** → **General**
3. 找到 **Root Directory** 設定
4. **清空 Root Directory 欄位**（留空）
5. 儲存設定
6. 重新部署

**說明：**
- 如果專案根目錄就是 `soloai-website`，則 Root Directory 應留空
- 如果專案在 GitHub 根目錄，Root Directory 應設為 `soloai-website`

---

### 1.3 npm install 依賴衝突

#### 錯誤訊息
```
npm ERR! peer dep missing: react@^18.0.0, required by ...
npm ERR! conflict: Cannot install dependency
```

#### 問題原因
- Next.js 14.2.3 與某些套件的 peer dependencies 版本不匹配
- npm 嚴格檢查依賴版本衝突

#### 解決方案

**使用 `--legacy-peer-deps` 旗標安裝：**
```bash
cd soloai-website
npm install --legacy-peer-deps
```

**或使用 `--force` 旗標（較不推薦）：**
```bash
npm install --force
```

**永久設定（在 `.npmrc` 檔案中）：**
```bash
# 在專案根目錄創建或編輯 .npmrc
legacy-peer-deps=true
```

**說明：**
- `--legacy-peer-deps` 會使用 npm v6 的依賴解析邏輯，較寬鬆
- 適用於 Next.js 14.x 與某些套件版本不匹配的情況

---

## 2. Google 認證 / API 連線錯誤 (401 / 500)

### 2.1 401 認證憑證缺失錯誤

#### 錯誤訊息
```
Request is missing required authentication credential. 
Expected OAuth 2 access token, login cookie or other valid authentication credential.
Status: 401 UNAUTHENTICATED
```

#### 問題原因
- JWT 認證物件已創建，但**未在實際使用前獲取 access token**
- Google API 需要先調用 `auth.authorize()` 或 `auth.getClient()` 來獲取 OAuth 2 access token

#### 解決方案

**檔案位置：** `app/api/reservation/route.ts`

**修正前：**
```typescript
const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILE_PATH,
  scopes: [...],
});

// ❌ 直接使用，未獲取 access token
const sheets = google.sheets({ version: "v4", auth });
```

**修正後：**
```typescript
const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILE_PATH,
  scopes: [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/calendar",
  ],
});

// ⭐ 關鍵修正：在實際使用前，明確獲取 access token
console.log("🔑 獲取 Google API Access Token...");
await auth.getClient();
console.log("✅ Google API 認證成功 (Access Token Acquired)");

// ✅ 現在可以安全使用
const sheets = google.sheets({ version: "v4", auth });
const calendar = google.calendar({ version: "v3", auth });
```

**關鍵點：**
- 必須在初始化 API 服務前調用 `await auth.getClient()`
- 這會向 Google 伺服器請求 OAuth 2 access token
- 只有獲取到 access token 後，才能成功調用 Google API

---

### 2.2 Invalid JWT Signature 錯誤

#### 錯誤訊息
```
invalid_grant: Invalid JWT Signature
Error: Invalid JWT: Token must be a short-lived token (60 minutes) and in a reasonable timeframe
```

#### 問題原因
- 環境變數中的私鑰字串在 Next.js webpack 打包環境中無法正確解析
- 換行符 (`\n`) 在環境變數中可能被轉義或丟失
- 系統時鐘不同步（JWT token 有時效性）

#### 解決方案

**方案 A：切換到 KeyFile 模式（推薦）**

**檔案位置：** `app/api/reservation/route.ts`

```typescript
import path from "path";

// ⭐ 核心修正：使用 keyFile 模式（最穩定的方式）
const SERVICE_ACCOUNT_FILE_NAME = 'service-account.json';
const KEYFILE_PATH = path.join(process.cwd(), SERVICE_ACCOUNT_FILE_NAME);

// 建立身份驗證物件（使用 keyFile 模式，繞過環境變數解析問題）
const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILE_PATH,
  scopes: [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/calendar",
  ],
});
```

**方案 B：修正環境變數格式（如果必須使用環境變數）**

在 `.env.local` 中，確保私鑰格式正確：
```bash
# ❌ 錯誤：換行符被轉義
GOOGLE_SERVICE_ACCOUNT_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w..."

# ✅ 正確：使用實際換行符或保留 \n
GOOGLE_SERVICE_ACCOUNT_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w..."
```

**程式碼中處理：**
```typescript
const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.replace(/\\n/g, '\n');
```

**時鐘同步檢查：**
```bash
# Windows
w32tm /resync

# Linux/Mac
sudo ntpdate -s time.nist.gov
```

---

### 2.3 KeyFile 解析失敗錯誤

#### 錯誤訊息
```
Error: No key or keyFile set.
Error: ENOENT: no such file or directory, open '.../service-account.json'
```

#### 問題原因
- `service-account.json` 檔案路徑不正確
- 檔案不存在於專案根目錄
- 檔案名稱或路徑拼寫錯誤

#### 解決方案

**步驟 1：確認檔案位置**

```bash
# 在專案根目錄檢查
cd soloai-website
ls -la service-account.json  # Linux/Mac
dir service-account.json      # Windows
```

**步驟 2：修正程式碼中的檔案路徑**

**檔案位置：** `app/api/reservation/route.ts`

```typescript
import path from "path";

// ⭐ 使用絕對路徑，確保檔案能被找到
const SERVICE_ACCOUNT_FILE_NAME = 'service-account.json';
const KEYFILE_PATH = path.join(process.cwd(), SERVICE_ACCOUNT_FILE_NAME);

console.log("📁 服務帳號金鑰檔案路徑:", KEYFILE_PATH);

// 驗證檔案是否存在（可選）
import fs from 'fs';
if (!fs.existsSync(KEYFILE_PATH)) {
  throw new Error(`服務帳號金鑰檔案不存在: ${KEYFILE_PATH}`);
}

const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILE_PATH,
  scopes: [...],
});
```

**步驟 3：確認檔案權限**

```bash
# 確保檔案可讀取
chmod 644 service-account.json  # Linux/Mac
```

**檔案結構範例：**
```
soloai-website/
├── app/
├── components/
├── service-account.json  ← 必須在專案根目錄
├── package.json
└── next.config.js
```

---

## 3. 路由與文件錯誤 (404 / Build Fail)

### 3.1 404 Not Found on `/reservation`

#### 錯誤訊息
```
404 Not Found
GET /reservation 404
```

#### 問題原因
- Next.js App Router 中缺少 `app/reservation/page.tsx` 檔案
- 路由檔案不存在或路徑不正確

#### 解決方案

**創建路由檔案：** `app/reservation/page.tsx`

```typescript
"use client";

import { useState } from "react";
import Link from "next/link";

// 時段選項
const timeSlots = [
  { value: "06:00-10:30", label: "06:00 - 10:30 早午餐" },
  { value: "11:30-14:00", label: "11:30 - 14:00 午餐" },
  { value: "14:00-17:00", label: "14:00 - 17:00 下午茶" },
  { value: "18:00-20:00", label: "18:00 - 20:00 晚餐" },
];

export default function ReservationPage() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    date: "",
    time: "",
    guests: 1,
    notes: "",
  });
  // ... 表單邏輯

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 py-12 px-4">
      {/* 表單內容 */}
    </div>
  );
}
```

**關鍵點：**
- 檔案必須命名為 `page.tsx`（App Router 約定）
- 必須使用 `export default` 導出組件
- 檔案路徑：`app/reservation/page.tsx` 對應路由 `/reservation`

---

### 3.2 TypeScript Type Error: JWT 參數數量錯誤

#### 錯誤訊息
```
Type error: Expected 0-1 argument, but got 4.
./app/admin/local/api/search/route.ts:54:9
const auth = new google.auth.JWT(
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  undefined,
  process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.replace(/\\n/g, "\n"),
  ["https://www.googleapis.com/auth/spreadsheets"]
);
```

#### 問題原因
- `google.auth.JWT()` 構造函式已更新為現代語法
- 舊的位置參數語法（4 個參數）已被棄用
- 新版本只接受 0-1 個參數（配置物件）

#### 解決方案

**檔案位置：** `app/admin/local/api/search/route.ts`

**修正前（過時語法）：**
```typescript
const auth = new google.auth.JWT(
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  undefined,
  process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.replace(/\\n/g, "\n"),
  ["https://www.googleapis.com/auth/spreadsheets"]
);
```

**修正後（現代語法）：**
```typescript
const auth = new google.auth.JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.replace(/\\n/g, '\n'),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
```

**關鍵變更：**
- 從位置參數改為配置物件
- 使用 `email`、`key`、`scopes` 屬性
- 保留環境變數字串的 `replace(/\\n/g, '\n')` 處理

---

### 3.3 GoogleAuth Type Error: authClient 類型不匹配

#### 錯誤訊息
```
Type error: No overload matches this call.
Type 'AnyAuthClient' is not assignable to type 'string | GoogleAuth<AuthClient> | OAuth2Client | BaseExternalAccountClient | undefined'.
```

#### 問題原因
- `auth.getClient()` 返回的 `authClient` 類型不符合 `google.sheets()` 的預期
- 在 API 調用中傳遞了多餘的 `auth` 參數

#### 解決方案

**檔案位置：** `app/api/reservation/route.ts`

**修正前：**
```typescript
const authClient = await auth.getClient();
const sheets = google.sheets({ version: "v4", auth: authClient });
const calendar = google.calendar({ version: "v3", auth: authClient });

// 在 API 調用中
await sheets.spreadsheets.values.append({
  auth: authClient,  // ❌ 多餘的參數
  spreadsheetId: SHEET_ID,
  ...
});
```

**修正後：**
```typescript
// ⭐ 獲取 access token，但不使用返回值
await auth.getClient();
console.log("✅ Google API 認證成功");

// ✅ 直接使用 auth 物件（已在初始化時設定）
const sheets = google.sheets({ version: "v4", auth });
const calendar = google.calendar({ version: "v3", auth });

// 在 API 調用中（移除 auth 參數）
await sheets.spreadsheets.values.append({
  spreadsheetId: SHEET_ID,  // ✅ 不需要 auth 參數
  range: `${sheetName}!A:H`,
  valueInputOption: "USER_ENTERED",
  requestBody: { values },
});
```

**關鍵點：**
- `google.sheets()` 和 `google.calendar()` 在初始化時已設定 `auth`
- 後續 API 調用不需要再傳遞 `auth` 參數
- `await auth.getClient()` 只需確保 access token 已獲取

---

## 📊 錯誤解決方案快速參考表

| 錯誤類型 | 錯誤訊息關鍵字 | 解決方案 | 檔案位置 |
|---------|--------------|---------|---------|
| Git Merge | `fatal: You are in the middle of a merge` | 完成合併後提交 | - |
| Vercel Root | `Root Directory does not exist` | 清空 Root Directory 設定 | Vercel Dashboard |
| npm 衝突 | `peer dep missing` | 使用 `--legacy-peer-deps` | `package.json` |
| 401 認證 | `missing required authentication credential` | 調用 `await auth.getClient()` | `app/api/reservation/route.ts` |
| JWT 簽名 | `Invalid JWT Signature` | 切換到 KeyFile 模式 | `app/api/reservation/route.ts` |
| KeyFile 錯誤 | `No key or keyFile set` | 確認檔案路徑正確 | `app/api/reservation/route.ts` |
| 404 路由 | `404 Not Found` | 創建 `page.tsx` 檔案 | `app/reservation/page.tsx` |
| JWT 參數 | `Expected 0-1 argument, but got 4` | 改用配置物件語法 | `app/admin/local/api/search/route.ts` |
| 類型錯誤 | `Type 'AnyAuthClient' is not assignable` | 移除多餘的 auth 參數 | `app/api/reservation/route.ts` |

---

## 🔧 常用除錯命令

### Git 操作
```bash
cd soloai-website
git status                    # 檢查狀態
git add .                     # 加入所有變更
git commit -m "訊息"           # 提交變更
git push origin main          # 推送到遠端
```

### 依賴管理
```bash
npm install --legacy-peer-deps  # 安裝依賴（解決衝突）
npm run build                  # 建置專案
npm run dev                    # 啟動開發伺服器
```

### 檔案檢查
```bash
# 檢查服務帳號檔案
ls -la service-account.json    # Linux/Mac
dir service-account.json       # Windows

# 檢查環境變數
cat .env.local                 # Linux/Mac
type .env.local                # Windows
```

---

## 📝 最佳實踐建議

### 1. Google 認證
- ✅ **優先使用 KeyFile 模式**：比環境變數更穩定
- ✅ **確保在 API 調用前獲取 access token**：調用 `await auth.getClient()`
- ✅ **使用 `GoogleAuth` 而非 `JWT`**：更現代且穩定

### 2. 錯誤處理
- ✅ **添加詳細的日誌輸出**：方便除錯
- ✅ **驗證環境變數和檔案存在**：在初始化時檢查
- ✅ **使用 try-catch 包裝 API 調用**：捕獲並記錄錯誤

### 3. 部署前檢查
- ✅ **確認所有環境變數已設定**：檢查 `.env.local`
- ✅ **確認服務帳號檔案存在**：檢查 `service-account.json`
- ✅ **執行 `npm run build` 確認無錯誤**：檢查 TypeScript 類型錯誤
- ✅ **確認 Vercel 設定正確**：Root Directory 設定

---

## 🎯 快速故障排除流程

1. **檢查終端機錯誤訊息** → 識別錯誤類型
2. **參考本文件對應章節** → 找到解決方案
3. **應用修正程式碼** → 更新對應檔案
4. **重新啟動開發伺服器** → `npm run dev`
5. **測試功能** → 確認問題已解決
6. **提交變更** → `git add . && git commit -m "fix: ..." && git push`

---

**文件維護者：** SoloAI 開發團隊  
**最後更新：** 2025-01-15  
**相關文件：** 
- `401錯誤修復報告.md`
- `診斷報告-預約API寫入失敗.md`
- `除錯指南-預約API錯誤追蹤.md`

