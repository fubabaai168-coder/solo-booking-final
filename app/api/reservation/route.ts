import { NextRequest, NextResponse } from 'next/server';
import { ReservationLog, ReservationLogSchema } from '@/app/types/reservationLog';
import { prisma } from '@/lib/prisma';
import { createCalendarEvent } from '@/lib/googleCalendar';

export const runtime = 'nodejs';

// 前端表單資料格式
interface FrontendPayload {
  name: string;
  phone: string;
  date: string;
  time: string;
  people: number;
  notes?: string;
}

// SaaS API 請求格式
interface SaasReservationPayload {
  resource_id: string;
  customer_name: string;
  contact: string;
  pax: number;
  start_time: string; // ISO 8601 datetime
  end_time: string; // ISO 8601 datetime
  booking_type: 'restaurant' | 'staff_service' | 'room_booking';
  notes?: string;
}

/**
 * 將前端時間格式轉換為 ISO 8601 datetime
 */
function parseTimeToISO(date: string, time: string): { startTime: string; endTime: string } {
  // 處理時間格式：可能是 "06:00-10:30" 或 "06:00 - 10:30"
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
  
  const startDateTime = `${date}T${startHour.padStart(2, '0')}:${startMinute.padStart(2, '0')}:00+08:00`;
  const endDateTime = `${date}T${endHour.padStart(2, '0')}:${endMinute.padStart(2, '0')}:00+08:00`;
  
  return { startTime: startDateTime, endTime: endDateTime };
}

/**
 * 將前端資料轉換為 ReservationLog 格式
 */
function transformToReservationLog(payload: FrontendPayload): ReservationLog {
  const { startTime } = parseTimeToISO(payload.date, payload.time);
  
  return {
    name: payload.name,
    phone: payload.phone,
    date: payload.date,
    dateTime: startTime,
    time: payload.time,
    people: payload.people || 1,
    notes: payload.notes || '', // 如果沒有備註，設為空字串
  };
}

/**
 * 將前端資料轉換為 SaaS API 格式
 */
function transformToSaasFormat(payload: FrontendPayload): SaasReservationPayload {
  const { startTime, endTime } = parseTimeToISO(payload.date, payload.time);
  
  // 從環境變數取得 resource_id，如果沒有則使用預設值
  const resourceId = process.env.SAAS_RESOURCE_ID || process.env.NEXT_PUBLIC_SAAS_RESOURCE_ID || '';
  
  if (!resourceId) {
    throw new Error('SAAS_RESOURCE_ID 環境變數未設定');
  }
  
  return {
    resource_id: resourceId,
    customer_name: payload.name,
    contact: payload.phone,
    pax: payload.people || 1,
    start_time: startTime,
    end_time: endTime,
    booking_type: 'restaurant', // 預設為餐廳訂位
    notes: payload.notes || undefined,
  };
}

export async function POST(req: NextRequest) {
  console.log('=== Proxy Reservation Start ===');
  console.log('請求方法：', req.method);
  console.log('請求 URL：', req.url);
  console.log('時間戳記：', new Date().toISOString());
  
  try {
    // === 解析請求資料 ===
    const contentType = req.headers.get('content-type') || '';
    let frontendPayload: FrontendPayload | null = null;
    
    console.log('Content-Type：', contentType);
    
    try {
      if (contentType.includes('application/json')) {
        console.log('解析 JSON 格式...');
        const jsonData = await req.json();
        frontendPayload = {
          name: String(jsonData.name || '').trim(),
          phone: String(jsonData.phone || '').trim(),
          date: String(jsonData.date || '').trim(),
          time: String(jsonData.time || '').trim(),
          people: Number(jsonData.people || jsonData.guests || 1) || 1,
          notes: jsonData.notes ? String(jsonData.notes).trim() : undefined,
        };
      } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
        console.log('解析 FormData 格式...');
        const form = await req.formData();
        const formData: any = Object.fromEntries(form.entries());
        frontendPayload = {
          name: String(formData.name || '').trim(),
          phone: String(formData.phone || '').trim(),
          date: String(formData.date || '').trim(),
          time: String(formData.time || '').trim(),
          people: Number(formData.people || formData.guests || 1) || 1,
          notes: formData.notes ? String(formData.notes).trim() : undefined,
        };
      } else {
        console.log('未知的 Content-Type，嘗試解析 JSON...');
        const jsonData = await req.json().catch(() => ({}));
        frontendPayload = {
          name: String(jsonData.name || '').trim(),
          phone: String(jsonData.phone || '').trim(),
          date: String(jsonData.date || '').trim(),
          time: String(jsonData.time || '').trim(),
          people: Number(jsonData.people || jsonData.guests || 1) || 1,
          notes: jsonData.notes ? String(jsonData.notes).trim() : undefined,
        };
      }
    } catch (parseError: any) {
      console.error('解析請求資料失敗：', parseError);
      console.error('錯誤堆疊：', parseError.stack);
      return NextResponse.json(
        { success: false, message: '請求資料格式錯誤', detail: String(parseError) },
        { status: 400 }
      );
    }
    
    console.log('收到前端資料：', JSON.stringify(frontendPayload, null, 2));
    
    // === 驗證必填欄位 ===
    if (!frontendPayload.name || !frontendPayload.phone || !frontendPayload.date || !frontendPayload.time) {
      const missingFields = [];
      if (!frontendPayload.name) missingFields.push('姓名');
      if (!frontendPayload.phone) missingFields.push('電話');
      if (!frontendPayload.date) missingFields.push('日期');
      if (!frontendPayload.time) missingFields.push('時段');
      
      console.error('缺少必填欄位：', missingFields);
      return NextResponse.json(
        { success: false, message: `缺少必填欄位：${missingFields.join('、')}` },
        { status: 400 }
      );
    }

    // === 轉換為 ReservationLog 格式並輸出 Log ===
    let reservationLog: ReservationLog;
    try {
      reservationLog = transformToReservationLog(frontendPayload);
      
      // 使用 Zod schema 驗證
      const validationResult = ReservationLogSchema.safeParse(reservationLog);
      if (!validationResult.success) {
        console.error('ReservationLog 驗證失敗：', validationResult.error.issues);
        return NextResponse.json(
          { 
            success: false, 
            message: '資料驗證失敗', 
            errors: validationResult.error.issues 
          },
          { status: 400 }
        );
      }
      
      // 輸出標準格式的 Reservation Log
      console.log('=== Reservation Log Start ===');
      console.log(JSON.stringify(reservationLog, null, 2));
      console.log('=== Reservation Log End ===');
    } catch (logError: any) {
      console.error('轉換為 ReservationLog 失敗：', logError);
      return NextResponse.json(
        { success: false, message: logError.message || '資料格式轉換失敗' },
        { status: 400 }
      );
    }

    // === 直接寫入資料庫 ===
    // 從環境變數取得 resource_id
    const resourceId = process.env.SAAS_RESOURCE_ID || process.env.NEXT_PUBLIC_SAAS_RESOURCE_ID || '';
    
    if (!resourceId) {
      console.error('環境變數 SAAS_RESOURCE_ID 未設定');
      return NextResponse.json(
        { success: false, message: 'SAAS_RESOURCE_ID 環境變數未設定' },
        { status: 500 }
      );
    }

    try {
      console.log('開始寫入資料庫...');
      console.log('Resource ID:', resourceId);
      
      // 使用 Prisma 直接寫入資料庫
      const reservation = await prisma.reservation.create({
        data: {
          resourceId: resourceId,
          name: frontendPayload.name,
          phone: frontendPayload.phone,
          date: frontendPayload.date,
          time: frontendPayload.time,
          people: frontendPayload.people || 1,
        }
      });

      console.log('✅ 預約已成功寫入資料庫');
      console.log('Reservation ID:', reservation.id);
      
      // === 同步到 Google Calendar ===
      try {
        console.log('開始同步到 Google Calendar...');
        await createCalendarEvent({
          name: reservation.name,
          phone: reservation.phone,
          date: reservation.date,
          time: reservation.time,
          people: reservation.people,
          notes: frontendPayload.notes || '',
        });
        console.log('✅ Google Calendar 同步成功');
      } catch (calendarError: any) {
        // 日曆同步失敗不影響預約成功，只記錄錯誤
        console.error('⚠️ Google Calendar 同步失敗（預約仍已保存）:', calendarError.message);
        console.error('錯誤詳情:', calendarError);
      }
      
      return NextResponse.json(
        { 
          success: true, 
          message: '預約成功！',
          data: {
            id: reservation.id,
            name: reservation.name,
            phone: reservation.phone,
            date: reservation.date,
            time: reservation.time,
            people: reservation.people,
            createdAt: reservation.createdAt,
          }
        },
        { status: 200 }
      );
    } catch (dbError: any) {
      console.error('=== 資料庫寫入失敗 ===');
      console.error('錯誤名稱：', dbError.name);
      console.error('錯誤訊息：', dbError.message);
      console.error('錯誤堆疊：', dbError.stack);
      
      return NextResponse.json(
        {
          success: false,
          message: '預約寫入失敗，請稍後再試',
          detail: String(dbError),
        },
        { status: 500 }
      );
    }

    // === 舊的 SaaS API 呼叫邏輯（已註解） ===
    /*
    // === 轉換為 SaaS API 格式 ===
    let saasPayload: SaasReservationPayload;
    try {
      saasPayload = transformToSaasFormat(frontendPayload);
      console.log('轉換後的 SaaS API 格式：', JSON.stringify(saasPayload, null, 2));
    } catch (transformError: any) {
      console.error('資料轉換失敗：', transformError);
      return NextResponse.json(
        { success: false, message: transformError.message || '資料格式轉換失敗' },
        { status: 400 }
      );
    }

    // === 呼叫 SaaS API ===
    const saasApiUrl = process.env.SAAS_API_URL || process.env.NEXT_PUBLIC_SAAS_API_URL || 'http://localhost:8080';
    const saasApiEndpoint = `${saasApiUrl}/api/v1/reservations/`;
    
    // 讀取並驗證 SAAS_API_KEY
    const apiKey = process.env.SAAS_API_KEY;
    
    if (!apiKey) {
      console.error('環境變數 SAAS_API_KEY 未設定');
      return NextResponse.json(
        { success: false, message: 'SAAS_API_KEY is not configured' },
        { status: 500 },
      );
    }
    
    console.log('呼叫 SaaS API：', saasApiEndpoint);
    console.log('SaaS API Payload：', JSON.stringify(saasPayload, null, 2));
    
    try {
      const saasResponse = await fetch(saasApiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-API-KEY': apiKey,
        },
        body: JSON.stringify(saasPayload),
      });

      console.log('SaaS API 回應狀態碼：', saasResponse.status);
      
      let saasResult: any = {};
      try {
        saasResult = await saasResponse.json();
        console.log('SaaS API 回應內容：', JSON.stringify(saasResult, null, 2));
      } catch (jsonError) {
        const textResponse = await saasResponse.text();
        console.error('SaaS API 回應不是 JSON：', textResponse);
        throw new Error(`SaaS API 回應格式錯誤：${textResponse}`);
      }

      if (saasResponse.ok) {
        // SaaS API 成功
        console.log('=== Proxy Reservation Success ===');
        return NextResponse.json(
          { success: true, message: '預約成功！' },
          { status: 200 }
        );
      } else {
        // SaaS API 回傳錯誤
        const errorMessage = saasResult.detail || saasResult.message || '預約處理失敗';
        console.error('SaaS API 錯誤：', errorMessage);
        return NextResponse.json(
          { success: false, message: errorMessage },
          { status: saasResponse.status }
        );
      }
    } catch (fetchError: any) {
      console.error('=== SaaS API 呼叫失敗 ===');
      console.error('錯誤名稱：', fetchError.name);
      console.error('錯誤訊息：', fetchError.message);
      console.error('錯誤堆疊：', fetchError.stack);
      
      return NextResponse.json(
        {
          success: false,
          message: '無法連線到預約服務，請稍後再試',
          detail: String(fetchError),
        },
        { status: 500 }
      );
    }
    */

  } catch (err: any) {
    // === 未預期錯誤 ===
    console.error('=== Proxy Reservation Error ===');
    console.error('錯誤名稱：', err.name);
    console.error('錯誤訊息：', err.message);
    console.error('錯誤堆疊：', err.stack);
    console.error('完整錯誤物件：', JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
    
    return NextResponse.json(
      {
        success: false,
        message: '預約處理失敗',
        detail: String(err),
      },
      { status: 500 }
    );
  }
}
