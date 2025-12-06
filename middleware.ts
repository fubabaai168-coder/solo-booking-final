import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 檢查是否訪問根路徑 /
  if (request.nextUrl.pathname === '/') {
    // 自動導到 /landing 
    return NextResponse.redirect(new URL('/landing', request.url));
  }
}

// 設置 matcher 來指定 middleware 應執行的路徑 
// 排除 /api/* 和靜態資源 (.svg, .png, .jpg, etc.)
export const config = {
  matcher: [
    '/', // 處理根路徑重定向
    '/landing', // 處理 landing 頁面
    '/reservation', // 處理預約頁面
    '/admin/:path*', // 處理後台頁面
    // 排除 public 檔案 (如圖片) 和 _next 內部資源，這通常是預設行為，但明確寫出更安全
  ],
};

// 備註：此配置確保 / 導向 /landing，且不影響 /api/* 。
