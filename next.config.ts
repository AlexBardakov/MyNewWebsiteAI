import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Разрешаем загрузку до 10 Мб
    },
  },
  images: {
    // Разрешаем показывать картинки из локальной папки uploads (если вдруг не настроено)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/catalog',
        permanent: true, // true - это 308 редирект (для SEO, если страница переехала навсегда)
                         // false - если временно (307)
      },
    ];
  }
};

export default nextConfig;
