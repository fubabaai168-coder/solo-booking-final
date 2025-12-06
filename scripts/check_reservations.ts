import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkReservations() {
  try {
    console.log('=== 查詢所有預約記錄 ===\n');

    // 查詢所有預約，按建立時間降序排列（最新的在前）
    const reservations = await prisma.reservation.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`找到 ${reservations.length} 筆預約記錄\n`);

    if (reservations.length === 0) {
      console.log('⚠️ 資料庫中目前沒有預約記錄');
    } else {
      console.log('預約記錄列表（最新的在前）：');
      console.log(JSON.stringify(reservations, null, 2));
      
      console.log('\n=== 摘要 ===');
      reservations.forEach((reservation, index) => {
        // 格式化日期時間
        const startDate = reservation.reservedStart.toISOString().split('T')[0];
        const startTime = reservation.reservedStart.toLocaleTimeString('zh-TW', { 
          hour: '2-digit', 
          minute: '2-digit',
          timeZone: 'Asia/Taipei'
        });
        const endTime = reservation.reservedEnd.toLocaleTimeString('zh-TW', { 
          hour: '2-digit', 
          minute: '2-digit',
          timeZone: 'Asia/Taipei'
        });
        const timeRange = `${startTime}-${endTime}`;
        
        console.log(`${index + 1}. ${reservation.customerName} - ${reservation.phone}`);
        console.log(`   日期：${startDate} ${timeRange}`);
        console.log(`   人數：${reservation.peopleCount}`);
        console.log(`   建立時間：${reservation.createdAt}`);
        console.log(`   ID：${reservation.id}`);
        if (reservation.calendarEventId) {
          console.log(`   Google Calendar Event ID：${reservation.calendarEventId}`);
        }
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ 查詢失敗:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkReservations();

