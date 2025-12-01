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
        console.log(`${index + 1}. ${reservation.name} - ${reservation.phone}`);
        console.log(`   日期：${reservation.date} ${reservation.time}`);
        console.log(`   人數：${reservation.people}`);
        console.log(`   建立時間：${reservation.createdAt}`);
        console.log(`   ID：${reservation.id}`);
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

