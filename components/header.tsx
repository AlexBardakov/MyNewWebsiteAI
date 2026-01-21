"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
// ВАЖНО: Используем новый хук useCart (а не useCartStore)
import { useCart } from "@/store/cart";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
// Импорт компонентов мобильного меню (убедитесь, что npx shadcn@latest add sheet выполнен)
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Header() {
  const pathname = usePathname();
  const cart = useCart();
  const [mounted, setMounted] = useState(false);

  // Решаем проблему гидратации
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
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
           🧀 CheeseShop
        </Link>

        {/* Десктопное меню */}
        <nav className="hidden md:flex items-center gap-6">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === route.href ? "text-black" : "text-muted-foreground"
              )}
            >
              {route.label}
            </Link>
          ))}
        </nav>

        {/* Правая часть: Корзина и Мобильное меню */}
        <div className="flex items-center gap-4">
          <Link href="/cart">
            <Button variant="outline" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {mounted && cart.items.length > 0 && (
                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                  {cart.totalItems()}
                </span>
              )}
            </Button>
          </Link>

          {/* Мобильное меню */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col gap-4 mt-8">
                {routes.map((route) => (
                  <Link
                    key={route.href}
                    href={route.href}
                    className={cn(
                        "text-lg font-medium",
                        pathname === route.href ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {route.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}