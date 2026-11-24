import type { Metadata } from "next";
import { Inter, Playfair_Display, Lora } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Header } from "@/components/header";
import Footer from "@/components/footer";
// ИЗМЕНЕНИЕ: Импортируем Toaster из 'sonner', а не 'toaster'
import { Toaster } from "@/components/ui/sonner";
import { CookieConsent } from "@/components/cookie-consent";

// Inter — основной sans-serif для текста (читаемость, нейтральность).
// Переменная --font-inter; итоговый стек --font-sans собирается в globals.css.
const inter = Inter({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-inter",
});

// Знак рубля «₽» из того же Inter, но отдельным файлом на 2 КБ.
// Зачем: в Google-нарезке Inter символ ₽ (U+20BD) лежит в файле «расширенной
// латиницы» весом 83 КБ, и каждая страница с ценами качала его ради одного значка.
// Этот шрифт стоит первым в стеке --font-sans и благодаря unicode-range
// используется ТОЛЬКО для ₽ — всё остальное рисует обычный Inter, вид не меняется.
// Файл получен один раз: fonts.googleapis.com/css2?family=Inter:wght@100..900&text=₽
// (лицензия Inter — SIL OFL, распространять можно).
const interRuble = localFont({
  src: "./fonts/inter-ruble.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  variable: "--font-ruble",
  declarations: [{ prop: "unicode-range", value: "U+20BD" }],
  adjustFontFallback: false,
});

// Playfair Display — серифный шрифт для КРУПНЫХ заголовков (h1, h2).
// Высококонтрастный didone-сериф — шикарен на размерах 24px+, но тонкие штрихи
// "теряются" на мелких размерах. Поэтому для h3, h4 используется Lora (см. ниже).
const playfair = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-serif-display",
  weight: ["400", "600", "700"],
});

// Lora — сериф для МЕЛКИХ заголовков (h3, h4). Низкий контраст штрихов,
// специально создана для веба, отлично читается на любых размерах.
// Стилистически совместима с Playfair — оба классические серифы.
const lora = Lora({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-serif",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://fourkings.ru"),
  title: {
    default: "Four Kings — крафтовая сыроварня в Томске",
    template: "%s | Four Kings",
  },
  description:
    "Крафтовые сыры собственного производства в Томске. Доставка по городу, самовывоз, подарочные сертификаты, конструктор сырной тарелки.",
  applicationName: "Four Kings",
  keywords: [
    "крафтовый сыр",
    "сыроварня Томск",
    "сырная тарелка",
    "купить сыр Томск",
    "подарочный сертификат сыр",
    "Four Kings",
  ],
  authors: [{ name: "ИП Фокин К. В." }],
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "https://fourkings.ru",
    siteName: "Four Kings",
    title: "Four Kings — крафтовая сыроварня в Томске",
    description:
      "Крафтовые сыры собственного производства. Доставка по Томску, самовывоз, подарочные сертификаты.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${inter.variable} ${interRuble.variable} ${playfair.variable} ${lora.variable}`}>
      <body className="font-sans antialiased">
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
        {/* Компонент тоже теперь называется Toaster, но он из другой библиотеки */}
        <Toaster />
        {/* Cookie-баннер: информирование о cookies (152-ФЗ, требование РКН). */}
        <CookieConsent />
      </body>
    </html>
  );
}