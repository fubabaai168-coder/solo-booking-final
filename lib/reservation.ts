import { google } from 'googleapis';

// TypeScript 型別定義
export interface ReservationPayload {
  name: string;
  phone: string;
  date: string;
  time: string;
  people: number;
  notes?: string;
}

/**
 * 處理時間格式，將時段字串轉換為 ISO 日期時間字串
 */
export function parseTimeToISO(date: string, time: string): string {
  const timeStr = time.replace(/\s+/g, ''); // 移除所有空格
  const [startStr] = timeStr.split('-');
  const [hour, minute] = startStr.split(':');
  
  if (!hour || !minute) {
    throw new Error('時段格式錯誤');
  }
  
  return `${date}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00+08:00`;
}

/**
 * 獲取 Google API 認證客戶端
 */
export async function getGoogleAuth() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/calendar'
    ],
  });

  await auth.getClient();
  return auth;
}

/**
 * 寫入 Google Sheets
 */
export async function writeToGoogleSheets(
  auth: any,
  payload: ReservationPayload
): Promise<void> {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) {
    throw new Error('GOOGLE_SHEET_ID 環境變數未設定');
  }

  const sheets = google.sheets({ version: 'v4', auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: 'Sheet1!A:F',
    valueInputOption: 'RAW',
    requestBody: {
      values: [[
        new Date().toISOString(),
        payload.name,
        payload.phone,
        payload.date,
        payload.time,
        payload.people
      ]],
    },
  });
}

/**
 * 寫入 Google Calendar
 */
export async function writeToGoogleCalendar(
  auth: any,
  payload: ReservationPayload,
  startDateTime: string
): Promise<void> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!calendarId) {
    console.warn('GOOGLE_CALENDAR_ID 環境變數未設定，跳過 Calendar 寫入');
    return;
  }

  const calendar = google.calendar({ version: 'v3', auth });
  const endDateTime = new Date(new Date(startDateTime).getTime() + 2.5 * 60 * 60 * 1000);

  await calendar.events.insert({
    calendarId: calendarId,
    requestBody: {
      summary: `餐廳預約 - ${payload.name} (${payload.people}人)`,
      description: `電話：${payload.phone}\n備註：${payload.notes || '無'}`,
      start: {
        dateTime: startDateTime,
        timeZone: 'Asia/Taipei',
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'Asia/Taipei',
      },
    },
  });
}

/**
 * 處理預約：寫入 Google Sheets 和 Calendar
 */
export async function processReservation(payload: ReservationPayload): Promise<void> {
  console.log('開始處理預約...');
  
  // 解析時間
  const startDateTime = parseTimeToISO(payload.date, payload.time);
  console.log('解析後開始時間：', startDateTime);

  // 獲取認證
  console.log('開始 Google API 認證...');
  const auth = await getGoogleAuth();
  console.log('Google 認證成功！');

  // 寫入 Google Sheets
  console.log('開始寫入 Google Sheets...');
  await writeToGoogleSheets(auth, payload);
  console.log('已成功寫入 Google Sheet');

  // 寫入 Google Calendar
  console.log('開始寫入 Google Calendar...');
  await writeToGoogleCalendar(auth, payload, startDateTime);
  console.log('已成功寫入 Google Calendar');
  
  console.log('預約處理完成！');
}



