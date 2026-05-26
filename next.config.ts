import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Server actions stable с Next.js 14, но опции (bodySizeLimit) живут в experimental namespace.
    // Это не активирует "экспериментальный режим" — просто синтаксис конфигурации.
    serverActions: {
      bodySizeLimit: "10mb", // Разрешаем загрузку до 10 Мб
    },
  },

  // Явно фиксируем корень проекта, чтобы Next.js не плутал между
  // /root/package-lock.json и /root/fourkingssite/package-lock.json на проде.
  // Это убирает warning "We detected multiple lockfiles".
  // process.cwd() — директория запуска Node-процесса; для prod-сборки и runtime
  // это всегда корень проекта (там, откуда вызывается `npm run build` / `npm start`).
  outputFileTracingRoot: process.cwd(),

  images: {
    // Все пользовательские изображения хранятся локально в public/uploads (см. lib/upload.ts).
    // Внешние домены не используются — это снижает юридический риск (152-ФЗ) и потенциальный SSRF.
    unoptimized: true,
    remotePatterns: [
      // Собственный домен — оставлен на случай локальных preview-сборок или зеркал
      { protocol: "https", hostname: "fourkings.ru" },
      { protocol: "https", hostname: "www.fourkings.ru" },
      // Локальная разработка
      { protocol: "http", hostname: "localhost" },
    ],
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/catalog",
        permanent: true, // true - это 308 редирект (для SEO, если страница переехала навсегда)
                         // false - если временно (307)
      },
    ];
  },
};

export default nextConfig;
