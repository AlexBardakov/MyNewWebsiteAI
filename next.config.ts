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
  // Это убирает warning "We detected multiple lockfiles" и устраняет потенциальные
  // расхождения в file tracing manifest, из-за которых ломаются server action IDs.
  //
  // Используем переменную окружения с fallback на относительный путь от next.config.ts.
  // На проде можно задать NEXT_PROJECT_ROOT="/root/fourkingssite" в .env,
  // если автоматическое определение по какой-то причине не работает.
  outputFileTracingRoot:
    process.env.NEXT_PROJECT_ROOT || process.cwd(),

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

  // HTTP-заголовки безопасности и приватности.
  //
  // Content-Security-Policy (CSP): allowlist того, ОТКУДА браузер может загружать
  // ресурсы. Запросы за пределы списка — блокируются на уровне браузера.
  //
  // Ключевая цель: блокировать Яндекс.Метрику (mc.yandex.ru, mc.webvisor.org и
  // прочее), которую Яндекс.Карты пытаются подгрузить автоматически. Скрипт карт
  // (api-maps.yandex.ru) — разрешён, а Метрика — нет.
  //
  // Permissions-Policy: запрещает использовать устаревшее API `unload`, на котором
  // спотыкается код Яндекс.Карт (warning "Permissions policy violation").
  // Также отключает interest-cohort (FLoC) — google-трекинг.
  async headers() {
    // CSP-директивы:
    //   default-src     — fallback для всех типов ресурсов;
    //   script-src      — где можно грузить JS (наш домен + Yandex Maps API);
    //   style-src       — стили (наш домен, inline для Tailwind, + стили карт);
    //   img-src         — картинки (наш домен, data: для inline, + тайлы карт);
    //   connect-src     — куда XHR/fetch могут стучать (API карт, геокодер);
    //   font-src        — шрифты (наш домен, data:, + Google Fonts cache);
    //   frame-src       — где можно встраивать iframe (только сам, нам hostов на стороне нет);
    //   object-src      — 'none' (запрет встраивания plugins/swf — мера безопасности);
    //   base-uri        — 'self' (запрет смены <base> другими доменами).
    //
    // ВАЖНО: домены метрики (mc.yandex.ru, mc.webvisor.org, yandex-metrika.com)
    // НЕ перечислены — это и есть блокировка. CSP по принципу allowlist:
    // не упомянуто — заблокировано.
    // Разрешённые домены для Яндекс.Карт (карта + геокодер + конструктор + тайлы).
    // Это все *.yandex.ru/yandex.net поддомены, которые реально нужны карте.
    // Метрика (mc.yandex.ru, mc.webvisor.org) сюда НЕ входит — она остаётся заблокированной.
    const yandexMapsDomains = [
      "https://api-maps.yandex.ru",       // Главный API карт
      "https://geocode-maps.yandex.ru",   // Геокодер (адрес ↔ координаты), JSONP
      "https://suggest-maps.yandex.ru",   // Автоподсказки адресов, JSONP
      "https://log.api-maps.yandex.ru",   // Логирование (не Метрика — внутренняя телеметрия карт)
      "https://*.maps.yandex.net",        // Тайлы карт (core-renderer-tiles, core-stv-renderer-cache, etc.)
      "https://yastatic.net",             // CDN стилей и шрифтов Яндекса
      "https://avatars.mds.yandex.net",   // Иконки точек, balloon-картинки
    ].join(" ");

    const csp = [
      "default-src 'self'",
      // script-src: важно включить geocode-maps и suggest-maps — они через JSONP
      // (script-тег) делают запросы. Без этого геокодинг падает с scriptError.
      `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${yandexMapsDomains}`,
      `style-src 'self' 'unsafe-inline' ${yandexMapsDomains} https://fonts.googleapis.com`,
      `img-src 'self' data: blob: ${yandexMapsDomains}`,
      `connect-src 'self' ${yandexMapsDomains}`,
      "font-src 'self' data: https://fonts.gstatic.com https://yastatic.net",
      "frame-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          // Блокировка Метрики и явное разрешение только нужных доменов.
          { key: "Content-Security-Policy", value: csp },
          // Блокировка устаревших permissions + отключение FLoC.
          {
            key: "Permissions-Policy",
            value: "unload=(), interest-cohort=(), browsing-topics=()",
          },
          // Дополнительная защита от MIME-sniffing и clickjacking
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
