import { google } from 'googleapis';
import path from 'path';

// 設定 Google Auth
// 優先使用環境變數（適用於 Vercel 部署），否則使用本地檔案（適用於本地開發）
let authConfig: any;

if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
  // 從環境變數讀取（Vercel 部署）
  try {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    authConfig = {
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    };
    console.log('使用環境變數進行 Google Calendar 認證');
  } catch (parseError) {
    console.error('解析 GOOGLE_SERVICE_ACCOUNT_KEY 失敗，回退到 keyFile 方式:', parseError);
    // 解析失敗時回退到 keyFile
    authConfig = {
      keyFile: path.join(process.cwd(), 'service-account.json'),
      scopes: ['https://www.googleapis.com/auth/calendar'],
    };
  }
} else {
  // 使用本地檔案（本地開發）
  authConfig = {
    keyFile: path.join(process.cwd(), 'service-account.json'),
    scopes: ['https://www.googleapis.com/auth/calendar'],
  };
  console.log('使用本地 service-account.json 進行 Google Calendar 認證');
}

const auth = new google.auth.GoogleAuth(authConfig);

// 取得 Calendar API 實例
const calendar = google.calendar({ version: 'v3', auth });

/**
 * 解析日期和時段，轉換為 ISO 8601 格式的開始和結束時間
 * @param date 日期字串 (格式: YYYY-MM-DD)
 * @param time 時段字串 (格式: HH:mm-HH:mm，例如: "14:00-17:00")
 * @returns 包含 startTime 和 endTime 的物件（ISO 8601 格式）
 */
function parseDateTime(date: string, time: string): { startTime: string; endTime: string } {
  // 處理時間格式：可能是 "14:00-17:00" 或 "14:00 - 17:00"
  const timeStr = time.replace(/\s+/g, ''); // 移除所有空格
  const [startStr, endStr] = timeStr.split('-');
  
  if (!startStr || !endStr) {
    throw new Error('時段格式錯誤，應為 "HH:MM-HH:MM" 格式');
  }
  
  const [startHour, startMinute] = startStr.split(':');
  const [endHour, endMinute] = endStr.split(':');
  
  if (!startHour || !startMinute || !endHour || !endMinute) {
    throw new Error('時段格式錯誤');
  }
  
  // 建立 ISO 8601 格式的日期時間字串（使用台灣時區 UTC+8）
  const startDateTime = `${date}T${startHour.padStart(2, '0')}:${startMinute.padStart(2, '0')}:00+08:00`;
  const endDateTime = `${date}T${endHour.padStart(2, '0')}:${endMinute.padStart(2, '0')}:00+08:00`;
  
  return { startTime: startDateTime, endTime: endDateTime };
}

/**
 * 在 Google Calendar 中建立預約事件
 * @param reservation 預約資料物件
 * @returns 建立的日曆事件
 */
export async function createCalendarEvent(reservation: any) {
  try {
    // 從環境變數取得 Calendar ID
    const calendarId = process.env.GOOGLE_CALENDAR_ID;
    
    if (!calendarId) {
      throw new Error('GOOGLE_CALENDAR_ID 環境變數未設定');
    }

    // 解析日期和時段
    const { startTime, endTime } = parseDateTime(reservation.date, reservation.time);

    // 建立事件標題
    const eventTitle = `[預約] ${reservation.name} (${reservation.people}人)`;

    // 建立事件描述
    const eventDescription = `Phone: ${reservation.phone}\nNotes: ${reservation.notes || '無'}`;

    // 建立日曆事件
    const event = {
      summary: eventTitle,
      description: eventDescription,
      start: {
        dateTime: startTime,
        timeZone: 'Asia/Taipei',
      },
      end: {
        dateTime: endTime,
        timeZone: 'Asia/Taipei',
      },
    };

    console.log('建立 Google Calendar 事件...');
    console.log('Calendar ID:', calendarId);
    console.log('事件標題:', eventTitle);
    console.log('開始時間:', startTime);
    console.log('結束時間:', endTime);

    const response = await calendar.events.insert({
      calendarId: calendarId,
      requestBody: event,
    });

    console.log('✅ Google Calendar 事件建立成功');
    console.log('事件 ID:', response.data.id);
    console.log('事件連結:', response.data.htmlLink);

    return response.data;
  } catch (error: any) {
    console.error('❌ 建立 Google Calendar 事件失敗:', error);
    throw error;
  }
}

