import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import Footer from "@/components/footer";
// ИЗМЕНЕНИЕ: Импортируем Toaster из 'sonner', а не 'toaster'
import { Toaster } from "@/components/ui/sonner";
import { CookieConsent } from "@/components/cookie-consent";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

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
    <html lang="ru">
      <body className={inter.className}>
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