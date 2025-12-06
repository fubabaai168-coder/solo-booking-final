"use client";

import Link from 'next/link';
import { Menu, BookOpen, Coffee, MapPin, CalendarCheck } from 'lucide-react';

export function Navbar() {
  const navItems = [
    { name: '菜單', href: '#menu', icon: BookOpen },
    { name: '關於我們', href: '#about', icon: Coffee },
    { name: '商家資訊', href: '#info', icon: MapPin },
    { name: '立即預約', href: '/reservation', icon: CalendarCheck, isPrimary: true },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
        <div className="text-2xl font-bold text-orange-600">
          微光暖食
        </div>
        <nav className="hidden md:flex space-x-6 lg:space-x-8 items-center">
          {navItems.map((item) => (
            <Link 
              key={item.name} 
              href={item.href} 
              className={`flex items-center space-x-1 font-medium transition duration-200 
                ${item.isPrimary 
                  ? 'px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 shadow-md' 
                  : 'text-gray-600 hover:text-orange-500'}`
              }
            >
              <item.icon className="w-4 h-4" />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
        <div className="md:hidden">
          <Menu className="w-6 h-6 text-orange-600 cursor-pointer" />
        </div>
      </div>
    </header>
  );
}





