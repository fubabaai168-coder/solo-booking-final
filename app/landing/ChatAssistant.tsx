"use client";

import { Menu } from 'lucide-react';

export function ChatAssistant() {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button className="flex items-center space-x-2 bg-orange-500 text-white p-3 rounded-full shadow-lg hover:bg-orange-600 transition-colors duration-300">
        <Menu className="w-6 h-6" /> 
        <span className="font-semibold hidden sm:inline">客服</span>
      </button>
    </div>
  );
}





