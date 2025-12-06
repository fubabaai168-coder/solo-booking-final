import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 flex flex-col items-center justify-center px-8 text-center">
      <div className="max-w-5xl">
        <h1 className="text-7xl md:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600 mb-6 leading-tight">
          微光暖食
        </h1>
        <p className="text-3xl md:text-5xl text-orange-700 mb-8">Soft Light Brunch</p>
        
        <p className="text-xl md:text-2xl text-orange-900 mb-16 leading-relaxed max-w-2xl mx-auto">
          12/10 成果展限定<br/>
          現點現做酪梨蛋、法式厚片、手沖咖啡<br/>
          用 AI 為你量身打造最舒適的早午餐時光
        </p>

        <Link href="/reservation">
          <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-2xl md:text-3xl px-20 py-10 rounded-3xl shadow-2xl transform hover:scale-110 transition-all duration-300">
            立即預約我的早午餐
          </button>
        </Link>
      </div>
    </main>
  );
}
