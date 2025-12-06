export function InfoSection() {
  return (
    <section id="info" className="w-full bg-white py-20 px-4 md:px-10 scroll-mt-20">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl font-bold text-center text-orange-600 mb-10">商家資訊</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-lg">
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">📅 成果展日期與時間</h3>
            <p className="text-gray-600">2025 年 12 月 10 日 (三)</p>
            <p className="text-gray-600">下午 2:00 (14:00) (預約制)</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">📍 活動地點</h3>
            <p className="text-gray-600">高雄市前鎮區復興四路 2 號四樓之一</p>
            <p className="text-gray-600">聯和趨動 AI 智慧商務產業人才培訓據點</p>
          </div>
          <div className="md:col-span-2">
            <h3 className="font-semibold text-gray-800 mb-2">📞 聯絡資訊</h3>
            <p className="text-gray-600">電話：07-973-5000</p>
            <p className="text-gray-600">E-mail：service@trendlink.com.tw</p>
          </div>
          <div className="md:col-span-2">
            <h3 className="font-semibold text-gray-800 mb-2">💡 預約須知</h3>
            <p className="text-gray-600">預約系統採實名制，請務必填寫正確的聯繫資訊。當日請準時抵達，系統會依據報到順序進行分流。</p>
          </div>
        </div>
      </div>
    </section>
  );
}





