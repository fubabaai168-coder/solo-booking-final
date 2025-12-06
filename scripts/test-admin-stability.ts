/**
 * 後台管理頁面穩定性測試腳本
 * 
 * 測試所有後台 API 和頁面的穩定性，確保沒有 500 錯誤
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const API_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

interface TestResult {
  name: string;
  status: 'pass' | 'fail';
  error?: string;
  details?: any;
}

const results: TestResult[] = [];

async function test(name: string, testFn: () => Promise<any>): Promise<void> {
  try {
    console.log(`\n🧪 測試: ${name}`);
    const result = await testFn();
    results.push({ name, status: 'pass', details: result });
    console.log(`✅ 通過: ${name}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    results.push({ name, status: 'fail', error: errorMessage });
    console.error(`❌ 失敗: ${name}`);
    console.error(`   錯誤: ${errorMessage}`);
  }
}

async function runAllTests() {
  console.log('='.repeat(60));
  console.log('後台管理頁面穩定性測試');
  console.log('='.repeat(60));

  // 1. 測試 Menu Categories API
  await test('GET /api/menu/categories', async () => {
    const res = await fetch(`${API_URL}/api/menu/categories`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.categories) throw new Error('Missing categories field');
    return { count: data.categories.length };
  });

  await test('GET /api/menu/categories?activeOnly=true&withItems=true', async () => {
    const res = await fetch(`${API_URL}/api/menu/categories?activeOnly=true&withItems=true`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { count: data.categories.length };
  });

  await test('POST /api/menu/categories (空資料庫)', async () => {
    // 先清理所有類別（僅在測試環境）
    // 注意：menuCategory 模型可能不存在於當前 Prisma Schema 中
    try {
      // @ts-ignore - menuCategory 模型可能不存在
      await prisma.menuCategory.deleteMany({});
    } catch (e) {
      // 忽略錯誤
    }

    const res = await fetch(`${API_URL}/api/menu/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '測試類別',
        description: '測試描述',
        isActive: true,
      }),
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(`HTTP ${res.status}: ${errorData.error || 'Unknown error'}`);
    }
    const data = await res.json();
    if (!data.category) throw new Error('Missing category field');
    return { id: data.category.id, position: data.category.position };
  });

  await test('POST /api/menu/categories (有資料)', async () => {
    const res = await fetch(`${API_URL}/api/menu/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '測試類別2',
        description: '測試描述2',
        isActive: true,
      }),
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(`HTTP ${res.status}: ${errorData.error || 'Unknown error'}`);
    }
    const data = await res.json();
    return { id: data.category.id, position: data.category.position };
  });

  await test('POST /api/menu/categories (指定 position)', async () => {
    const res = await fetch(`${API_URL}/api/menu/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '測試類別3',
        position: 999,
        isActive: true,
      }),
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(`HTTP ${res.status}: ${errorData.error || 'Unknown error'}`);
    }
    const data = await res.json();
    if (data.category.position !== 999) {
      throw new Error(`Position mismatch: expected 999, got ${data.category.position}`);
    }
    return { id: data.category.id, position: data.category.position };
  });

  // 2. 測試 Menu Items API
  await test('GET /api/menu/items', async () => {
    const res = await fetch(`${API_URL}/api/menu/items`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.items) throw new Error('Missing items field');
    return { count: data.items.length };
  });

  // 3. 測試 Reservations API
  await test('GET /admin/reservations (頁面)', async () => {
    const res = await fetch(`${API_URL}/admin/reservations`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { status: res.status };
  });

  await test('資料庫查詢: Reservation', async () => {
    const reservations = await prisma.reservation.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
    });
    return { count: reservations.length };
  });

  // 4. 測試 Support APIs
  await test('GET /api/support/templates', async () => {
    const res = await fetch(`${API_URL}/api/support/templates`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.templates) throw new Error('Missing templates field');
    return { count: data.templates.length };
  });

  await test('GET /admin/support-sessions (頁面)', async () => {
    const res = await fetch(`${API_URL}/admin/support-sessions`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { status: res.status };
  });

  // 5. 測試錯誤處理
  await test('POST /api/menu/categories (無效數據)', async () => {
    const res = await fetch(`${API_URL}/api/menu/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // 缺少必填欄位 name
        description: '測試',
      }),
    });
    if (res.status !== 400) {
      throw new Error(`Expected 400, got ${res.status}`);
    }
    const data = await res.json();
    if (!data.error) throw new Error('Missing error field');
    return { status: res.status, error: data.error };
  });

  await test('POST /api/menu/categories (重複名稱)', async () => {
    // 先創建一個類別
    // @ts-ignore - menuCategory 模型可能不存在
    const category = await prisma.menuCategory.create({
      data: {
        name: '重複測試類別',
        position: 1,
        isActive: true,
      },
    });

    const res = await fetch(`${API_URL}/api/menu/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '重複測試類別', // 重複名稱
        isActive: true,
      }),
    });

    // 清理測試數據
    // @ts-ignore - menuCategory 模型可能不存在
    await prisma.menuCategory.delete({ where: { id: category.id } });

    if (res.status !== 400) {
      throw new Error(`Expected 400 for duplicate name, got ${res.status}`);
    }
    const data = await res.json();
    return { status: res.status, error: data.error };
  });

  // 6. 測試資料庫連接
  await test('資料庫連接測試', async () => {
    await prisma.$queryRaw`SELECT 1`;
    return { connected: true };
  });

  // 生成報告
  console.log('\n' + '='.repeat(60));
  console.log('測試結果摘要');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;

  console.log(`\n總測試數: ${results.length}`);
  console.log(`✅ 通過: ${passed}`);
  console.log(`❌ 失敗: ${failed}`);

  if (failed > 0) {
    console.log('\n失敗的測試:');
    results.filter(r => r.status === 'fail').forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  if (failed === 0) {
    console.log('✅ 所有測試通過！系統穩定。');
  } else {
    console.log('❌ 部分測試失敗，請檢查上述錯誤。');
    process.exit(1);
  }
  console.log('='.repeat(60));
}

// 執行測試
runAllTests()
  .catch((error) => {
    console.error('測試執行失敗:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
