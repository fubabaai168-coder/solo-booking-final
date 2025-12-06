/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // 啟用 Next.js 內建的圖片優化 (Image Optimization)
  images: {
    // 設置為空陣列，表示信任所有主機來源，通常用於本地開發
    // 如果有外部圖片，則需要設定 domains
    remotePatterns: [],
    // 確保 next/image 能夠處理本地的靜態資源
    unoptimized: false, // 確保優化器是開啟的
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ];
  },
};

console.log('Next.js Image Configured');

module.exports = nextConfig;
