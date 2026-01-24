import { ReactNode } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Layers,
  ChefHat,
  UtensilsCrossed,
  LogOut,
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout } from "./login/actions";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

// Компонент навигации (без изменений)
function AdminNav({ className }: { className?: string }) {
  return (
    <nav className={`flex flex-col gap-2 p-4 ${className}`}>
      <div className="mb-6 px-2 flex items-center gap-2 font-bold text-xl text-primary">
        🧀 AdminPanel
      </div>

      <Link href="/admin">
        <Button variant="ghost" className="w-full justify-start gap-2">
          <LayoutDashboard className="h-4 w-4" />
          Обзор
        </Button>
      </Link>

      <Link href="/admin/orders">
        <Button variant="ghost" className="w-full justify-start gap-2">
          <ShoppingCart className="h-4 w-4" />
          Заказы
        </Button>
      </Link>

      <div className="my-2 border-t border-border/50" />
      <p className="px-2 text-xs font-semibold text-muted-foreground mb-1">Каталог</p>

      <Link href="/admin/products">
        <Button variant="ghost" className="w-full justify-start gap-2">
          <Package className="h-4 w-4" />
          Товары
        </Button>
      </Link>
      <Link href="/admin/categories">
        <Button variant="ghost" className="w-full justify-start gap-2">
          <Layers className="h-4 w-4" />
          Категории
        </Button>
      </Link>
      <Link href="/admin/product-groups">
        <Button variant="ghost" className="w-full justify-start gap-2">
          <UtensilsCrossed className="h-4 w-4" />
          Конструктор тарелок
        </Button>
      </Link>

      <Link href="/admin/recipes">
        <Button variant="ghost" className="w-full justify-start gap-2">
          <ChefHat className="h-4 w-4" />
          Рецепты
        </Button>
      </Link>

      <div className="mt-auto pt-4 border-t border-border">
        <form action={logout}>
          <Button variant="outline" className="w-full gap-2 text-red-500 hover:text-red-600 hover:bg-red-50">
            <LogOut className="h-4 w-4" />
            Выйти
          </Button>
        </form>
      </div>
    </nav>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-secondary/10 flex flex-col md:flex-row">

      {/* 1. Мобильная шапка (видна только на мобильных) */}
      <header className="md:hidden flex items-center border-b bg-background px-4 h-14 sticky top-0 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <AdminNav />
          </SheetContent>
        </Sheet>
        <span className="ml-4 font-semibold">Панель управления</span>
      </header>

      {/* 2. Десктопный сайдбар (стоит рядом с контентом, не поверх) */}
      <aside className="hidden md:block w-64 border-r bg-background flex-shrink-0 sticky top-0 h-screen overflow-y-auto">
        <AdminNav className="h-full" />
      </aside>

      {/* 3. Основной контент */}
      <main className="flex-1 min-w-0">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}