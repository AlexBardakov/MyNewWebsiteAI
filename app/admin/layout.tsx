import Link from "next/link";
import { Package, FolderTree, Settings, LogOut, BookOpen, Layers } from "lucide-react";
import { logout } from "@/lib/auth";
import { redirect } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {

  // Функция выхода
  async function handleLogout() {
    "use server";
    await logout();
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Боковое меню */}
      <aside className="w-full md:w-64 bg-slate-900 text-white md:min-h-screen">
        <div className="p-6">
          <h2 className="text-xl font-bold tracking-tight">Cheese Admin</h2>
        </div>
        <nav className="space-y-1 px-3">
          <AdminLink href="/admin/products" icon={<Package className="h-5 w-5" />} label="Товары" />
          <AdminLink href="/admin/categories" icon={<FolderTree className="h-5 w-5" />} label="Категории" />
          <AdminLink href="/admin/recipes" icon={<BookOpen className="h-5 w-5" />} label="Рецепты" />
          <AdminLink href="/admin/cheese-plate" icon={<Layers className="h-5 w-5" />} label="Сырная тарелка" />
          <AdminLink href="/admin/about" icon={<Settings className="h-5 w-5" />} label="О нас" />

          <div className="pt-8 mt-8 border-t border-slate-700">
            <form action={handleLogout}>
              <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-red-300 hover:bg-slate-800 hover:text-red-200 transition-colors">
                <LogOut className="h-5 w-5" />
                Выйти
              </button>
            </form>
          </div>
        </nav>
      </aside>

      {/* Основной контент */}
      <main className="flex-1 bg-gray-50 p-8">
        {children}
      </main>
    </div>
  );
}

// Маленький вспомогательный компонент для ссылок
function AdminLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-md px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}