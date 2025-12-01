// 註冊 Store 到 SaaS API 的臨時腳本
require('dotenv').config({ path: '.env.local' });

const BASE_URL = 'https://reservation-api-662486332332.asia-east1.run.app/api/v1';
const API_KEY = process.env.SAAS_API_KEY;

if (!API_KEY) {
  console.error('❌ 錯誤: SAAS_API_KEY 環境變數未設定');
  console.error('請確認 .env.local 檔案中有 SAAS_API_KEY');
  process.exit(1);
}

const payload = {
  name: 'Solo Success Bistro',
  description: 'Created by SoloAI'
};

async function registerStore() {
  console.log('=== 開始註冊 Store ===');
  console.log('API Base URL:', BASE_URL);
  console.log('API Key:', API_KEY.substring(0, 10) + '...');
  console.log('Payload:', JSON.stringify(payload, null, 2));
  console.log('');

  // 嘗試不同的端點格式
  const endpoints = [
    '/stores',
    '/stores/',
    '/resources',
    '/resources/',
    '/locations',
    '/locations/',
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`\n嘗試 POST ${endpoint}...`);
      const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': API_KEY,
      },
      body: JSON.stringify(payload),
    });

    console.log('回應狀態碼:', response.status);
    console.log('回應標頭:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('回應內容:', responseText);

    if (response.ok) {
      try {
        const data = JSON.parse(responseText);
        console.log('\n✅ 成功建立 Store!');
        console.log('完整回應:', JSON.stringify(data, null, 2));
        
        // 處理不同的回應格式
        let storeId = null;
        if (Array.isArray(data) && data.length > 0) {
          storeId = data[0].id;
        } else if (data.id) {
          storeId = data.id;
        } else if (typeof data === 'object' && Object.keys(data).length > 0) {
          storeId = data.id || data.resource_id || data.uuid || data.store_id;
        }
        
        if (storeId) {
          console.log('\n📋 Store ID:', storeId);
          console.log('\n✅ 請將以下內容更新到 .env.local:');
          console.log(`SAAS_RESOURCE_ID=${storeId}`);
        } else {
          console.log('\n⚠️ 回應中沒有找到 ID，嘗試查詢已建立的 resources...');
          // 嘗試 GET 請求查詢
          try {
            const getResponse = await fetch(`${BASE_URL}/resources`, {
              method: 'GET',
              headers: {
                'X-API-KEY': API_KEY,
              },
            });
            if (getResponse.ok) {
              const resources = await getResponse.json();
              console.log('現有的 Resources:', JSON.stringify(resources, null, 2));
              if (Array.isArray(resources) && resources.length > 0) {
                // 尋找剛建立的 resource（名稱匹配）
                const newResource = resources.find(r => r.name === payload.name || r.name === 'Solo Success Bistro');
                if (newResource && newResource.id) {
                  console.log('\n📋 找到剛建立的 Resource ID:', newResource.id);
                  console.log('\n✅ 請將以下內容更新到 .env.local:');
                  console.log(`SAAS_RESOURCE_ID=${newResource.id}`);
                } else if (resources.length > 0) {
                  // 如果找不到，使用最新的
                  const latestResource = resources[resources.length - 1];
                  if (latestResource.id) {
                    console.log('\n📋 最新建立的 Resource ID:', latestResource.id);
                    console.log('\n✅ 請將以下內容更新到 .env.local:');
                    console.log(`SAAS_RESOURCE_ID=${latestResource.id}`);
                  }
                }
              } else {
                console.log('⚠️ 沒有找到任何 resources');
              }
            } else {
              console.log('GET 請求失敗，狀態碼:', getResponse.status);
            }
          } catch (getError) {
            console.log('查詢 resources 時發生錯誤:', getError.message);
          }
        }
      } catch (parseError) {
        console.log('\n⚠️ 回應不是 JSON 格式');
        console.log('原始回應:', responseText);
      }
        return; // 成功後退出
      } else {
        console.log(`❌ ${endpoint} 失敗，狀態碼:`, response.status);
        if (response.status !== 404) {
          console.log('錯誤訊息:', responseText);
        }
      }
    } catch (error) {
      console.log(`❌ 請求 ${endpoint} 時發生錯誤:`, error.message);
      continue; // 繼續嘗試下一個端點
    }
  }
  
  console.log('\n❌ 所有端點都失敗了，請檢查 API 文檔確認正確的端點');
}

// 執行
registerStore().catch(console.error);
