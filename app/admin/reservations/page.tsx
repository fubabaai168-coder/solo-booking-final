import { prisma } from '@/lib/prisma';

// 強制動態渲染，確保每次請求都獲取最新資料
export const dynamic = 'force-dynamic';

async function getReservations() {
  try {
    const reservations = await prisma.reservation.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    return reservations;
  } catch (error) {
    console.error('查詢預約記錄失敗:', error);
    return [];
  }
}

export default async function ReservationsPage() {
  const reservations = await getReservations();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* 頁面標題 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📅 預約管理系統
          </h1>
          <p className="text-gray-600">
            總共 {reservations.length} 筆預約記錄
          </p>
        </div>

        {/* 預約記錄表格 */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
          {reservations.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 text-lg">目前尚無預約資料</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      📅 日期
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      🕒 時段
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      👤 姓名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      📞 電話
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      👥 人數
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      📝 建立時間
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reservations.map((reservation) => (
                    <tr
                      key={reservation.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap border-b border-gray-100">
                        <div className="text-sm font-medium text-gray-900">
                          {reservation.date}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap border-b border-gray-100">
                        <div className="text-sm text-gray-900">
                          {reservation.time}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap border-b border-gray-100">
                        <div className="text-sm font-medium text-gray-900">
                          {reservation.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap border-b border-gray-100">
                        <div className="text-sm text-gray-900">
                          {reservation.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap border-b border-gray-100">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          {reservation.people} 人
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap border-b border-gray-100">
                        <div className="text-sm text-gray-900">
                          {new Date(reservation.createdAt).toLocaleString('zh-TW')}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
