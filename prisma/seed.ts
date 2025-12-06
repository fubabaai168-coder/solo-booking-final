import { PrismaClient } from '@prisma/client';
import { createRequire } from 'module';
// SQLite 客戶端從 schema-sqlite.prisma 生成
const require = createRequire(import.meta.url);
const { PrismaClient: SQLiteClient } = require('../node_modules/.prisma/client-sqlite');

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 從 prisma/seed.ts 執行時，__dirname 是 prisma 資料夾
// 資料庫檔案在 prisma/prisma/reservation-dev.db
const sqlite = new SQLiteClient({
  datasources: {
    db: {
      url: `file:${path.join(__dirname, 'prisma', 'reservation-dev.db')}`,
    },
  },
});

const postgres = new PrismaClient();

async function main() {
  const models = ['Resource', 'Reservation', 'ChatSession', 'ChatMessage', 'SupportTemplate'];

  for (const model of models) {
    if (typeof (sqlite as any)[model] === 'undefined') {
      console.log(`[跳過] 模型 ${model} 不存在於 schema 中`);
      continue;
    }

    const records = await (sqlite as any)[model].findMany();
    if (records.length === 0) {
      console.log(`[${model}] 沒有資料`);
      continue;
    }

    await (postgres as any)[model].createMany({
      data: records,
      skipDuplicates: true,
    });

    console.log(`[${model}] 搬移完成，共 ${records.length} 筆`);
  }
}

main()
  .catch((e) => {
    console.error('❌ 搬移資料失敗', e);
    process.exit(1);
  })
  .finally(async () => {
    await sqlite.$disconnect();
    await postgres.$disconnect();
  });

