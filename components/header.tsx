'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBasket, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/cart';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

// Простая навигация
const navItems = [
  { name: 'Каталог', href: '/catalog' },
  { name: 'О нас', href: '/about' },
  // { name: 'Конструктор', href: '/constructor' }, // Пока скроем
];

export default function Header() {
  const pathname = usePathname();
  const cartItems = useCartStore((state) => state.items);
  const [mounted, setMounted] = useState(false);

  // Избегаем ошибки гидратации (Zustand persist работает в браузере)
  useEffect(() => {
    setMounted(true);
  }, []);

  const cartCount = mounted ? cartItems.length : 0;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        
        {/* Логотип */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
              Сырная Лавка
            </span>
          </Link>
          
          {/* Десктопное меню */}
          <nav className="hidden md:flex gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === item.href ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* Правая часть: Корзина */}
        <div className="flex items-center gap-2">
          <Link href="/checkout"> 
            {/* Можно сделать ссылку на /cart, но мы договорились упрощать - сразу к оформлению или в корзину */}
            <Button variant="ghost" className="relative">
              <ShoppingBasket className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
                  {cartCount}
                </span>
              )}
              <span className="sr-only">Корзина</span>
            </Button>
          </Link>
          
          {/* Мобильное меню (пока заглушка кнопки) */}
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}