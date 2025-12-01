// 插入特定的 Resource ID 到資料庫
require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function insertResource() {
  try {
    console.log('=== 開始插入 Resource ===');
    console.log('Resource ID: ab620a6f-085a-4977-ad46-dc94891a778a');
    
    // 檢查是否已存在
    const existing = await prisma.resource.findUnique({
      where: { id: 'ab620a6f-085a-4977-ad46-dc94891a778a' }
    });

    if (existing) {
      console.log('✅ Resource 已存在:');
      console.log(JSON.stringify(existing, null, 2));
      return;
    }

    // 插入新的 Resource
    const resource = await prisma.resource.create({
      data: {
        id: 'ab620a6f-085a-4977-ad46-dc94891a778a',
        name: 'Solo Success Bistro',
        description: 'Created by SoloAI',
        type: 'restaurant',
      }
    });

    console.log('✅ 成功插入 Resource:');
    console.log(JSON.stringify(resource, null, 2));
    console.log('\n✅ 請確認 .env.local 中的 SAAS_RESOURCE_ID 設定為:');
    console.log('SAAS_RESOURCE_ID=ab620a6f-085a-4977-ad46-dc94891a778a');

  } catch (error) {
    console.error('❌ 插入失敗:', error.message);
    console.error('完整錯誤:', error);
  } finally {
    await prisma.$disconnect();
  }
}

insertResource();

