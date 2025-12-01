// 環境變數設定輔助腳本
// 使用方法: node setup-env.js

const fs = require('fs');
const path = require('path');

console.log('🔧 環境變數設定輔助工具\n');

// 讀取服務帳號 JSON 檔案
const serviceAccountPath = path.join(__dirname, 'service-account.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ 找不到服務帳號 JSON 檔案:', serviceAccountPath);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

// 建立 .env.local 範例內容
const envContent = `# Google Sheets API 設定
# 請填入您的 Google Sheets ID（從 Google Sheets 網址列取得）
GOOGLE_SHEETS_ID=your-spreadsheet-id-here

# Google Calendar API 設定
# 請填入您的 Google Calendar ID（通常是 Email 格式）
GOOGLE_CALENDAR_ID=your-calendar-id@group.calendar.google.com

# Google Service Account 設定（已從 JSON 檔案自動填入）
GOOGLE_SERVICE_ACCOUNT_EMAIL=${serviceAccount.client_email}
GOOGLE_SERVICE_ACCOUNT_KEY="${serviceAccount.private_key}"

# Google Gemini API 設定
# 請前往 https://makersuite.google.com/app/apikey 取得 API 金鑰
GEMINI_API_KEY=your-gemini-api-key-here
`;

const envLocalPath = path.join(__dirname, '.env.local');

// 檢查 .env.local 是否已存在
if (fs.existsSync(envLocalPath)) {
  console.log('⚠️  .env.local 檔案已存在！');
  console.log('   如果要覆蓋，請先刪除現有檔案，然後重新執行此腳本。\n');
  console.log('   或者，您可以手動編輯 .env.local 檔案，並確保包含以下內容：\n');
  console.log(envContent);
} else {
  // 寫入 .env.local 檔案
  fs.writeFileSync(envLocalPath, envContent, 'utf8');
  console.log('✅ 已創建 .env.local 檔案！\n');
  console.log('📋 已自動填入的環境變數：');
  console.log(`   GOOGLE_SERVICE_ACCOUNT_EMAIL: ${serviceAccount.client_email}\n`);
  console.log('⚠️  請手動填入以下環境變數：');
  console.log('   1. GOOGLE_SHEETS_ID - 從 Google Sheets 網址列取得');
  console.log('   2. GOOGLE_CALENDAR_ID - 從 Google Calendar 設定取得');
  console.log('   3. GEMINI_API_KEY - 從 Google AI Studio 取得\n');
  console.log('📝 編輯完成後，請重新啟動開發伺服器（npm run dev）\n');
}




