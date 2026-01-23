"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/store/cart";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Header() {
  const pathname = usePathname();
  const cart = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const routes = [
    { href: "/catalog", label: "Каталог" },
    { href: "/cheese-plate", label: "Сырная тарелка" },
    { href: "/recipes", label: "Рецепты" },
    { href: "/about", label: "О нас" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">

        {/* Логотип */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl hover:opacity-80 transition-opacity">
           🧀 <span className="hidden sm:inline">CheeseShop</span>
           <span className="sm:hidden">CS</span>
        </Link>

        {/* Десктопное меню */}
        <nav className="hidden md:flex items-center gap-6">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === route.href ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {route.label}
            </Link>
          ))}
        </nav>

        {/* Правая часть: Корзина и Мобильное меню */}
        <div className="flex items-center gap-4">
          <Link href="/cart">
            {/* ИЗМЕНЕНИЯ: Убрали rounded-full, добавили текст "Корзина" */}
            <Button variant="outline" className="relative gap-2 border-primary/20 hover:border-primary hover:bg-primary/5">
              <ShoppingCart className="h-5 w-5" />

              {/* Текст виден только на экранах больше мобильного */}
              <span className="hidden sm:inline font-semibold">Корзина</span>

              {/* Бейдж с количеством */}
              {mounted && cart.items.length > 0 && (
                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground shadow-md animate-in zoom-in">
                  {cart.items.length}
                </span>
              )}
            </Button>
          </Link>

          {/* Мобильное меню */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col gap-6 mt-8">
                <Link href="/" className="font-bold text-xl mb-4">
                  🧀 CheeseShop
                </Link>
                <nav className="flex flex-col gap-4">
                  {routes.map((route) => (
                    <Link
                      key={route.href}
                      href={route.href}
                      className={cn(
                          "text-lg font-medium py-2 px-4 rounded-lg transition-colors",
                          pathname === route.href
                            ? "bg-secondary text-foreground"
                            : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                      )}
                    >
                      {route.label}
                    </Link>
                  ))}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}