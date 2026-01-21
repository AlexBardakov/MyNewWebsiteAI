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
};

export default nextConfig;
