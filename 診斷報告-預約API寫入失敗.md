# 🔍 診斷報告：預約 API 寫入失敗

## 📋 問題描述

**PM 回報：** 已提交一筆預約單，但資料未寫入 Google Sheet (`Reservations_v2_MAIN`)

## ✅ 已發現並修復的問題

### 🐛 問題 1：工作表名稱不匹配（已修復）

**問題：**
- 程式碼中使用的工作表名稱：`Brunch_Reservations`
- 實際 Google Sheet 中的工作表名稱：`Reservations_v2_MAIN`

**位置：** `app/api/reservation/route.ts` 第 133 行

**修復：**
```typescript
// 修復前
const sheetName = "Brunch_Reservations";

// 修復後
const sheetName = "Reservations_v2_MAIN";
```

**影響：** 這是導致寫入失敗的主要原因。如果工作表名稱不正確，Google Sheets API 會找不到目標工作表，導致寫入失敗。

## 🔍 需要檢查的其他問題

### 1. 環境變數設定

請確認以下環境變數已正確設定在 `.env.local` 中：

```bash
GOOGLE_SHEETS_ID=your-spreadsheet-id
GOOGLE_SERVICE_ACCOUNT_EMAIL=places-api-service@localbizfinder-477001.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_KEY="-----BEGIN PRIVATE KEY-----\n..."
GOOGLE_CALENDAR_ID=your-calendar-id
```

### 2. Google Sheets 權限

**檢查項目：**
- ✅ 服務帳號 Email (`places-api-service@localbizfinder-477001.iam.gserviceaccount.com`) 是否有權限存取試算表
- ✅ 服務帳號是否有「編輯者」權限（至少需要「編輯者」才能寫入）

**設定方式：**
1. 開啟 Google Sheets
2. 點擊右上角「共用」
3. 輸入服務帳號 Email：`places-api-service@localbizfinder-477001.iam.gserviceaccount.com`
4. 選擇「編輯者」權限
5. 點擊「傳送」

### 3. 工作表結構

**確認項目：**
- ✅ 工作表 `Reservations_v2_MAIN` 是否存在
- ✅ 工作表是否有正確的欄位結構（A:H，8 個欄位）

**預期欄位結構：**
```
A: name (姓名)
B: phone (電話)
C: date (日期)
D: time (時段)
E: guests (人數)
F: notes (備註)
G: calendarLink (日曆連結)
H: timestamp (時間戳記)
```

## 📊 程式碼檢查結果

### ✅ 寫入邏輯檢查

**位置：** `app/api/reservation/route.ts` 第 130-160 行

**檢查項目：**

1. **欄位數量：** ✅ 正確（8 個欄位）
   ```typescript
   const values = [
     [
       name,        // A: name
       phone,       // B: phone
       date,        // C: date
       time,        // D: time
       guests.toString(), // E: guests
       notes || "", // F: notes
       calendarLink, // G: calendarLink
       new Date().toLocaleString("zh-TW"), // H: timestamp
     ],
   ];
   ```

2. **寫入範圍：** ✅ 正確（`Reservations_v2_MAIN!A:H`）
   ```typescript
   range: `${sheetName}!A:H`
   ```

3. **寫入方法：** ✅ 正確（`append` 方法）
   ```typescript
   await sheets.spreadsheets.values.append({...})
   ```

### ✅ 錯誤處理

**位置：** `app/api/reservation/route.ts` 第 171-193 行

**檢查項目：**
- ✅ 有完整的 try-catch 錯誤處理
- ✅ 有詳細的錯誤日誌輸出
- ✅ 有環境變數檢查

## 🧪 測試步驟

### 步驟 1：重新啟動開發伺服器

**重要：** 修復後必須重新啟動開發伺服器！

```bash
# 停止當前伺服器（Ctrl + C）
# 重新啟動
cd soloai-website
npm run dev
```

### 步驟 2：提交測試預約單

1. 開啟瀏覽器：`http://localhost:3000/reservation`
2. 填寫表單：
   - 姓名：測試用戶
   - 電話：0912345678
   - 日期：選擇未來日期
   - 時段：選擇一個時段
   - 人數：2
   - 備註：（可選）
3. 點擊「提交預約」

### 步驟 3：檢查終端機日誌

**成功時應看到：**
```
📝 收到預約請求
📋 接收到的資料: {...}
🔐 開始 Google 身份驗證...
📋 環境變數讀取檢查:
  GOOGLE_SERVICE_ACCOUNT_EMAIL: places-api-service@localbizfinder-477001.iam.gserviceaccount.com
  GOOGLE_SERVICE_ACCOUNT_KEY:
    長度: 1679 字符
    ...
📊 寫入 Google Sheets...
   試算表 ID: your-spreadsheet-id
   工作表名稱: Reservations_v2_MAIN
   寫入資料: [...]
✅ Google Sheets 寫入成功
✅ 預約成功完成
```

**失敗時應看到：**
```
❌ 預約寫入失敗:
錯誤訊息: [具體錯誤訊息]
環境變數檢查:
  GOOGLE_SHEETS_ID: 已設定 / ❌ 未設定
  ...
```

### 步驟 4：驗證 Google Sheets

1. 開啟 Google Sheets
2. 找到工作表 `Reservations_v2_MAIN`
3. 檢查最後一筆資料是否為剛才提交的預約

## 🎯 核心任務一：診斷結果

### ✅ 已修復的問題

1. **工作表名稱不匹配** - 已將 `Brunch_Reservations` 修正為 `Reservations_v2_MAIN`

### ⚠️ 需要進一步檢查的問題

1. **環境變數設定** - 請確認所有環境變數已正確設定
2. **Google Sheets 權限** - 請確認服務帳號有權限存取試算表
3. **工作表結構** - 請確認工作表 `Reservations_v2_MAIN` 存在且結構正確

### 📝 建議的後續步驟

1. **重新啟動開發伺服器**（必須！）
2. **提交測試預約單**
3. **檢查終端機日誌**，如果仍有錯誤，請提供完整的錯誤訊息
4. **驗證 Google Sheets**，確認資料是否寫入

## 🎯 核心任務二：管理後台狀態

### ✅ 後台路由確認

**路由結構：**
- **主路由：** `/admin`
- **商家查詢管理：** `/admin/local`

### 📋 頁面建置狀態

#### 1. `/admin` - 管理儀表板

**檔案：** `app/admin/page.tsx`

**狀態：** ✅ 已建立，基本架構完成

**內容：**
- 簡單的標題顯示：「早午餐網站管理儀表板」
- 使用 `AdminLayout` 佈局（包含側邊導航欄）

**訪問方式：** `http://localhost:3000/admin`

#### 2. `/admin/local` - 商家查詢管理

**檔案：** `app/admin/local/page.tsx`

**狀態：** ✅ 已建立，功能完整

**內容：**
- 在地商家查詢功能
- 包含搜尋輸入框（關鍵字、地區）
- 使用 API 路由：`/admin/local/api/search`
- 顯示搜尋結果列表

**訪問方式：** `http://localhost:3000/admin/local`

#### 3. `/admin` 佈局

**檔案：** `app/admin/layout.tsx`

**狀態：** ✅ 已建立，包含側邊導航欄

**內容：**
- 側邊導航欄（寬度 250px）
- 導航連結：
  - 「儀表板」→ `/admin`
  - 「商家查詢管理」→ `/admin/local`
- 主內容區域（flex 佈局）

### 🔐 登入狀態

**目前狀態：** ❌ 未實作登入功能

**說明：**
- 管理後台目前**不需要登入**即可訪問
- 所有路由都是公開的
- 建議後續實作身份驗證機制

### 📊 總結

| 項目 | 狀態 | 說明 |
|------|------|------|
| `/admin` 路由 | ✅ 正常 | 基本儀表板已建立 |
| `/admin/local` 路由 | ✅ 正常 | 商家查詢功能完整 |
| 側邊導航欄 | ✅ 正常 | 包含兩個導航連結 |
| 登入功能 | ❌ 未實作 | 目前為公開訪問 |

---

## 🚀 下一步行動

1. **立即修復：** 工作表名稱已修正，請重新啟動開發伺服器並測試
2. **驗證權限：** 確認服務帳號有權限存取 Google Sheets
3. **測試寫入：** 提交測試預約單，檢查終端機日誌和 Google Sheets
4. **回報結果：** 如果仍有問題，請提供完整的終端機錯誤日誌

---

**修復完成時間：** 2025-01-XX
**修復內容：** 將工作表名稱從 `Brunch_Reservations` 修正為 `Reservations_v2_MAIN`










