"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';

export function HeroSection() {
  const heroVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  return (
    <section 
      id="hero" 
      className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-6 text-center scroll-mt-16"
    >
      <motion.h1 
        variants={heroVariants}
        initial="hidden"
        animate="visible"
        className="text-7xl font-extrabold text-orange-700 mb-4 tracking-tight"
      >
        微光暖食
      </motion.h1>
      <motion.p 
        variants={heroVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.1 }}
        className="text-2xl text-gray-700 mb-8 max-w-xl"
      >
        AI 驅動的頂級早午餐體驗 — 成果展限定，限量預約。
      </motion.p>
      <motion.div
        variants={heroVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
      >
        <Link 
          href="/reservation" 
          className="px-10 py-4 text-xl bg-orange-500 text-white font-bold rounded-xl shadow-2xl hover:bg-orange-600 transition duration-300 transform hover:scale-105 inline-block"
        >
          立即預約 AI 早午餐
        </Link>
      </motion.div>
    </section>
  );
}





