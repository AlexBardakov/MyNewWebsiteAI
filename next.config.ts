import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Разрешаем загрузку до 10 Мб
    },
  },
  images: {
    // Все пользовательские изображения хранятся локально в public/uploads (см. lib/upload.ts).
    // Внешние домены не используются — это снижает юридический риск (152-ФЗ) и потенциальный SSRF.
    unoptimized: true,
    remotePatterns: [
      // Собственный домен — оставлен на случай локальных preview-сборок или зеркал
      { protocol: 'https', hostname: 'fourkings.ru' },
      { protocol: 'https', hostname: 'www.fourkings.ru' },
      // Локальная разработка
      { protocol: 'http', hostname: 'localhost' },
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
