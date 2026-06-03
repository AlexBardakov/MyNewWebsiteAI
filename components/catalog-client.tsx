'use client';

import { Fragment, useState, useEffect } from 'react';
import { ProductCard } from '@/components/product-card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getStoreStatus } from '@/lib/time';
import { DividerOrnament, FlourishedHeading } from '@/components/ornaments';

interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  priceRub: number;
  imageUrl: string | null;
  unit: string;
  avgPackWeightGrams: number | null;
  remainder: number;
  categoryId: string;
  category?: { id: string; name: string };
  // Добавляем массив вариантов
  variants: { id: string; name: string }[];
  displayOrder?: number;
  isActive?: boolean;
}

interface CatalogClientProps {
  initialProducts: Product[];
  categories: Category[];
}

export default function CatalogClient({ initialProducts, categories }: CatalogClientProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Логика показа уведомления о времени работы
  useEffect(() => {
    const status = getStoreStatus();
    if (status === 'open') return;

    const todayDate = new Date().toLocaleDateString();
    const lastShownDate = localStorage.getItem('status_warning_date');

    if (lastShownDate !== todayDate) {
      if (status === 'closed') {
        toast('Сыровары Четырех королевств сейчас отдыхают 🌙', {
          description: 'Вы можете собрать корзину, а мы бережно обработаем ваш заказ в рабочие часы.',
          duration: 6000,
        });
      } else if (status === 'closing_soon') {
        toast('Кажется, молоко убегает 🧀', {
          description: 'Мы можем не успеть доставить заказ сегодня. Если мы не свяжемся с Вами в течение 10 минут, скорее всего доставка перенесется на завтра.',
          duration: 10000,
        });
      }
      localStorage.setItem('status_warning_date', todayDate);
    }
  }, []);

  // Функция для плавного скролла к категории
  const scrollToCategory = (categoryId: string) => {
    const element = document.getElementById(`category-${categoryId}`);
    if (element) {
      // Отступ сверху, чтобы заголовок не перекрывался меню (offset)
      const y = element.getBoundingClientRect().top + window.scrollY - 140;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActiveCategory(categoryId);
    }
  };

  return (
    <div className="pb-20">

      

      {/* 1. Sticky Меню Категорий.
          Mobile-first: кнопки чуть крупнее (h-9, px-4) для удобного тапа пальцем.
          Фон ТОТ ЖЕ что у страницы (background/85) — чтобы меню визуально сливалось
          с hero, без эффекта "отрезанной полосы". При скролле визуальное отделение
          обеспечит backdrop-blur (а не border/shadow). */}
      <div className="sticky top-[60px] z-30 bg-background/85 backdrop-blur-lg py-3 mb-10 md:mb-12">
        <div className="container mx-auto px-4 md:px-8">
            <div className="flex gap-2.5 sm:gap-3 overflow-x-auto no-scrollbar pb-1">
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={activeCategory === cat.id ? 'default' : 'outline'}
                  onClick={() => scrollToCategory(cat.id)}
                  className={cn(
                    "h-9 px-4 text-sm font-medium rounded-full whitespace-nowrap transition-all shadow-sm",
                    activeCategory === cat.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-card hover:bg-secondary border-border text-foreground/80"
                  )}
                >
                  {cat.name}
                </Button>
              ))}
            </div>
        </div>
      </div>

{/* 2. HERO-СЕКЦИЯ КАТАЛОГА.
          Поскольку главная страница редиректит на каталог, эта секция фактически
          является "лицом" сайта. Заголовок в Playfair, вензели по бокам — для
          премиальной аура. Mobile-first: на узких экранах вензели скрываются
          (внутри FlourishedHeading уже sm:block), остаётся компактный заголовок. */}
      <section className="container mx-auto px-4 pt-6 pb-8 md:pt-12 md:pb-10 text-center">
          <h1 className="text-3xl md:text-5xl text-foreground mb-2 md:mb-3">
            Каталог
          </h1>
        <p className="mt-3 md:mt-4 text-sm md:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Крафтовые сыры, сделанные с любовью.
        </p>
      </section>


      {/* 1. Основной контейнер */}
      <div className="container mx-auto px-4 md:px-8 space-y-12">

        {/* Сначала отфильтруем только категории с товарами — чтобы DividerOrnament
            корректно показывался между видимыми секциями (а не между пропущенными). */}
        {categories
          .map((c) => ({
            category: c,
            products: initialProducts.filter((p) => p.categoryId === c.id),
          }))
          .filter(({ products }) => products.length > 0)
          .map(({ category, products: categoryProducts }, visibleIndex) => (
            <Fragment key={category.id}>
              {/* Декоративный разделитель — между секциями категорий, кроме первой.
                  Создаёт ритм странице, перекликается со стилистикой логотипа.
                  Без -my-* — пусть space-y-12 родителя даёт полноценный воздух. */}
              {visibleIndex > 0 && (
                <DividerOrnament className="max-w-3xl mx-auto" />
              )}
              <section id={`category-${category.id}`} className="scroll-mt-32">
                <h2 className="text-2xl md:text-3xl mb-6 text-foreground flex items-center gap-3">
                  {category.name}
                  <span className="text-sm font-normal text-muted-foreground bg-secondary/30 px-2 py-0.5 rounded-full">
                    {categoryProducts.length}
                  </span>
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
                  {categoryProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            </Fragment>
          ))}

        {initialProducts.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
                Товары не найдены
            </div>
        )}
      </div>


    </div>
  );
}