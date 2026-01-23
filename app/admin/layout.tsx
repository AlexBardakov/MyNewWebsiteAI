import Link from 'next/link';
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Settings,
  LogOut,
  ChefHat,
  PieChart
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      {/* shrink-0: Запрещает меню сжиматься или растягиваться. Оно всегда будет ровно w-64 (256px) */}
      <aside className="w-36 shrink-0 bg-slate-900 text-white p-6 flex flex-col min-h-screen">
        <div className="mb-8">
          <h1 className="text-xl font-bold">🧀 Admin Panel</h1>
        </div>

        <nav className="space-y-2 flex-1">
          <Link href="/admin">
            <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Обзор
            </Button>
          </Link>
          <Link href="/admin/orders">
            <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Заказы
            </Button>
          </Link>
          <Link href="/admin/products">
            <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800">
              <Package className="mr-2 h-4 w-4" />
              Товары
            </Button>
          </Link>
          <Link href="/admin/categories">
            <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800">
              <Settings className="mr-2 h-4 w-4" />
              Категории каталога
            </Button>
          </Link>

          <Link href="/admin/product-groups">
            <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800">
              <PieChart className="mr-2 h-4 w-4" />
              Конструктор тарелок
            </Button>
          </Link>

          <Link href="/admin/recipes">
            <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800">
              <ChefHat className="mr-2 h-4 w-4" />
              Рецепты
            </Button>
          </Link>
        </nav>

        <div className="pt-6 border-t border-slate-700">
           <Link href="/">
            <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white">
              <LogOut className="mr-2 h-4 w-4" />
              На сайт
            </Button>
           </Link>
        </div>
      </aside>

      {/* Main Content */}
      {/* flex-1: Занимает всё оставшееся свободное место */}
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}