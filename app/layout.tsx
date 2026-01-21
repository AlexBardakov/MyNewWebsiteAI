import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import Footer from "@/components/footer";
// ИЗМЕНЕНИЕ: Импортируем Toaster из 'sonner', а не 'toaster'
import { Toaster } from "@/components/ui/sonner"; 

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "Сырная лавка",
  description: "Лучшие сыры и деликатесы",
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
      </body>
    </html>
  );
}