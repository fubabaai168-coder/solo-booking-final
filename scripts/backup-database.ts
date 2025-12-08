// 資料庫備份腳本
// 使用 Prisma 導出資料庫內容為 JSON 格式
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function backupDatabase() {
  try {
    console.log('📦 開始備份資料庫...');
    
    const backupData: any = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: {}
    };

    // 備份所有模型
    console.log('📋 備份 Reservation...');
    backupData.data.reservations = await prisma.reservation.findMany();
    console.log(`✅ 已備份 ${backupData.data.reservations.length} 筆預約記錄`);

    console.log('📋 備份 Resource...');
    backupData.data.resources = await prisma.resource.findMany();
    console.log(`✅ 已備份 ${backupData.data.resources.length} 筆資源記錄`);

    console.log('📋 備份 ChatSession...');
    backupData.data.chatSessions = await prisma.chatSession.findMany();
    console.log(`✅ 已備份 ${backupData.data.chatSessions.length} 筆對話記錄`);

    console.log('📋 備份 ChatMessage...');
    backupData.data.chatMessages = await prisma.chatMessage.findMany();
    console.log(`✅ 已備份 ${backupData.data.chatMessages.length} 筆訊息記錄`);

    console.log('📋 備份 SupportTemplate...');
    backupData.data.supportTemplates = await prisma.supportTemplate.findMany();
    console.log(`✅ 已備份 ${backupData.data.supportTemplates.length} 筆模板記錄`);

    // 確保備份目錄存在
    const backupDir = path.join(process.cwd(), '..', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // 儲存備份檔案
    const backupFile = path.join(backupDir, 'solo-db-backup-2025-12-06.json');
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2), 'utf-8');
    
    console.log(`✅ 資料庫備份完成：${backupFile}`);
    console.log(`📊 備份統計：`);
    console.log(`   - 預約記錄：${backupData.data.reservations.length} 筆`);
    console.log(`   - 資源記錄：${backupData.data.resources.length} 筆`);
    console.log(`   - 對話記錄：${backupData.data.chatSessions.length} 筆`);
    console.log(`   - 訊息記錄：${backupData.data.chatMessages.length} 筆`);
    console.log(`   - 模板記錄：${backupData.data.supportTemplates.length} 筆`);

  } catch (error) {
    console.error('❌ 備份失敗：', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

backupDatabase()
  .then(() => {
    console.log('🎉 備份流程完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 備份流程失敗：', error);
    process.exit(1);
  });




