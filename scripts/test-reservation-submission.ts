/**
 * 預約表單提交驗收測試腳本
 * 
 * 測試流程：
 * 1. 準備測試數據
 * 2. 發送 POST 請求到 /api/reservations/create
 * 3. 驗證 API 回應（應為 201）
 * 4. 使用 Prisma 查詢資料庫驗證記錄
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 測試數據
const testData = {
  name: "微光驗收測試",
  guests: 4,
  date: "2025-12-10",
  timeSlot: "MORNING_2", // 使用有效的 timeSlot ID (10:30–12:00，最接近用戶要求的 11:00-12:00)
  phone: "0912345678",
  notes: "驗收測試備註"
};

const API_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

async function runValidation() {
  console.log('='.repeat(60));
  console.log('預約表單提交驗收測試');
  console.log('='.repeat(60));
  console.log('\n1. 準備測試數據:');
  console.log(JSON.stringify(testData, null, 2));
  
  try {
    // 2. 發送 POST 請求
    console.log('\n2. 發送 POST 請求到 /api/reservations/create...');
    const response = await fetch(`${API_URL}/api/reservations/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const responseData = await response.json();
    
    console.log(`\n   狀態碼: ${response.status}`);
    console.log(`   回應數據:`, JSON.stringify(responseData, null, 2));

    // 3. 驗證 API 回應
    if (response.status !== 201) {
      throw new Error(`API 回應狀態碼錯誤: 預期 201，實際 ${response.status}`);
    }

    if (!responseData.status || responseData.status !== 'success') {
      throw new Error(`API 回應狀態錯誤: 預期 success，實際 ${responseData.status}`);
    }

    if (!responseData.reservationId) {
      throw new Error('API 回應缺少 reservationId');
    }

    console.log('\n✅ API 回應驗證通過');
    console.log(`   預約 ID: ${responseData.reservationId}`);

    // 4. 使用 Prisma 查詢資料庫驗證
    console.log('\n3. 查詢資料庫驗證記錄...');
    const reservation = await prisma.reservation.findUnique({
      where: { id: responseData.reservationId },
    });

    if (!reservation) {
      throw new Error('資料庫中找不到對應的預約記錄');
    }

    console.log('\n   資料庫記錄:');
    console.log(JSON.stringify({
      id: reservation.id,
      customerName: reservation.customerName,
      phone: reservation.phone,
      peopleCount: reservation.peopleCount,
      reservedStart: reservation.reservedStart.toISOString(),
      reservedEnd: reservation.reservedEnd.toISOString(),
      status: reservation.status,
      notes: reservation.notes,
    }, null, 2));

    // 驗證數據正確性
    if (reservation.customerName !== testData.name) {
      throw new Error(`顧客姓名不匹配: 預期 "${testData.name}"，實際 "${reservation.customerName}"`);
    }

    if (reservation.peopleCount !== testData.guests) {
      throw new Error(`人數不匹配: 預期 ${testData.guests}，實際 ${reservation.peopleCount}`);
    }

    // 驗證日期時間
    const expectedStart = new Date(`${testData.date}T10:30:00`);
    const expectedEnd = new Date(`${testData.date}T12:00:00`);
    
    const actualStart = new Date(reservation.reservedStart);
    const actualEnd = new Date(reservation.reservedEnd);

    // 允許 1 分鐘的誤差（時區問題）
    const startDiff = Math.abs(actualStart.getTime() - expectedStart.getTime());
    const endDiff = Math.abs(actualEnd.getTime() - expectedEnd.getTime());

    if (startDiff > 60000) {
      throw new Error(`開始時間不匹配: 預期約 ${expectedStart.toISOString()}，實際 ${actualStart.toISOString()}`);
    }

    if (endDiff > 60000) {
      throw new Error(`結束時間不匹配: 預期約 ${expectedEnd.toISOString()}，實際 ${actualEnd.toISOString()}`);
    }

    console.log('\n✅ 資料庫驗證通過');
    console.log(`   顧客姓名: ${reservation.customerName} ✓`);
    console.log(`   人數: ${reservation.peopleCount} ✓`);
    console.log(`   開始時間: ${reservation.reservedStart.toISOString()} ✓`);
    console.log(`   結束時間: ${reservation.reservedEnd.toISOString()} ✓`);
    console.log(`   狀態: ${reservation.status} ✓`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ 驗收測試通過！');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ 驗收測試失敗:');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 執行測試
runValidation();





