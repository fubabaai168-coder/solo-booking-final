"use client";

import { motion } from 'framer-motion';
import { Navbar } from './Navbar';
import { HeroSection } from './HeroSection';
import { AboutSection } from './AboutSection';
import { InfoSection } from './InfoSection';
import { ChatAssistant } from './ChatAssistant';

// =======================================================================
// 1. 靜態菜單數據
// =======================================================================

const menuItems = [
  { category: '主餐', name: '暖食經典早午餐', price: '$280', description: '嫩煎里肌、太陽蛋，佐特製果醬烤吐司。', image: '/images/main-1.jpg' },
  { category: '主餐', name: '異國風味燉飯', price: '$320', description: '主廚特製松露醬，搭配當季時蔬，素食可選。', image: '/images/main-2.jpg' },
  { category: '飲料', name: 'AI 精選手沖咖啡', price: '$150', description: '中淺焙衣索比亞豆，帶有花香與柑橘調。', image: '/images/drink-1.jpg' },
  { category: '飲料', name: '鮮榨暖陽果汁', price: '$130', description: '當季鮮橙與蘋果現榨，無糖健康飲品。', image: '/images/drink-2.jpg' },
  { category: '甜點', name: '微光限定布朗尼', price: '$100', description: '70% 巧克力，搭配自製香草冰淇淋，限量供應。', image: '/images/dessert-1.jpg' },
  { category: '甜點', name: '主廚私房甜點', price: '$90', description: '每日限量，使用當季在地食材，口感驚艷。', image: '/images/dessert-2.jpg' },
];

// =======================================================================
// 2. MenuSection Component
// =======================================================================

const MenuSection = () => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 50 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as const } },
  };

  return (
    <section 
      id="menu" 
      className="w-full bg-white py-20 px-4 md:px-10 shadow-xl scroll-mt-20"
    >
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center text-orange-600 mb-12 border-b-4 border-orange-200 pb-3 tracking-wider">
          微光暖食 | 成果展限定菜單
        </h2>
        
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-3 gap-10"
        >
          {menuItems.map((menuItem, index) => (
            <motion.div
              key={index}
              variants={item}
              className="bg-gray-50 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 transform hover:scale-[1.02] border border-orange-100"
            >
              {/* 圖片區：使用 CSS 背景圖渲染 */}
              <div 
                className="w-full h-64 bg-gray-300 flex items-center justify-center bg-cover bg-center rounded-t-xl"
                style={{ 
                  backgroundImage: `url(${menuItem.image})`, 
                  backgroundColor: '#FDBA74' // 圖片載入前的暖色佔位
                }}
              />
              
              <div className="p-6">
                <span className="inline-block bg-orange-100 text-orange-700 text-xs font-semibold px-3 py-1 rounded-full mb-3 uppercase">
                  {menuItem.category}
                </span>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{menuItem.name}</h3>
                <p className="text-2xl font-extrabold text-orange-500 mb-4">{menuItem.price}</p>
                <p className="text-gray-600 text-sm">{menuItem.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

// =======================================================================
// 3. LandingPage Component
// =======================================================================

export default function LandingPage() {
  return (
    <>
      {/* 使用 div 替換 main，並設定 pt-16 以避免被 Navbar 遮擋 */}
      <div className="min-h-screen pt-16 bg-gradient-to-br from-amber-50 to-orange-100"> 
        <Navbar />
      <HeroSection />
      <MenuSection />
      <AboutSection />
      <InfoSection />

      {/* Footer */}
      <footer className="w-full bg-gray-800 text-white text-center py-6 mt-10">
        © 2025 微光暖食 |{" "}
        <a
          href="https://aigent.tw/admin"
          className="underline hover:text-orange-300 transition"
          target="_blank"
          rel="noopener noreferrer"
        >
          SoloAI 人機協作系統
        </a>
      </footer>

      <ChatAssistant />
      </div>
    </>
  );
}
