'use client';

import { useEffect, useState } from 'react';
import { ProductCard } from '@/components/product-card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  priceRub: number;
  imageUrl: string | null;
  unit: string;
  description: string | null;
  avgPackWeightGrams: number | null;
  remainder: number;
  categoryId: string;
}

interface CatalogClientProps {
  initialProducts: Product[];
  categories: Category[];
}

export default function CatalogClient({ initialProducts, categories }: CatalogClientProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

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
      {/* 1. Sticky Меню Категорий
        top-[60px] - примерная высота твоего Header. Если он выше/ниже, поправь это число.
        z-30 - чтобы меню было под модалками, но над товарами.
      */}
      <div className="sticky top-[60px] z-30 bg-white/80 backdrop-blur-md border-b py-3 mb-6 shadow-sm">
        <div className="container mx-auto px-4 md:px-8">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={activeCategory === cat.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => scrollToCategory(cat.id)}
                  className={cn(
                    "rounded-full whitespace-nowrap transition-all shadow-sm",
                    activeCategory === cat.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-white hover:bg-gray-100 border-gray-200 text-gray-700"
                  )}
                >
                  {cat.name}
                </Button>
              ))}
            </div>
        </div>
      </div>

      {/* 2. Основной контейнер с отступами (решает проблему прилипания к краям) */}
      <div className="container mx-auto px-4 md:px-8 space-y-12">

        {categories.map((category) => {
          // Фильтруем товары для текущей категории
          const categoryProducts = initialProducts.filter(
            (p) => p.categoryId === category.id
          );

          // Если товаров в категории нет, не выводим блок
          if (categoryProducts.length === 0) return null;

          return (
            <section
                key={category.id}
                id={`category-${category.id}`}
                className="scroll-mt-32" // Дополнительный отступ для якоря
            >
              {/* 3. Явный заголовок категории */}
              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900 flex items-center gap-3">
                 {category.name}
                 <span className="text-sm font-normal text-muted-foreground bg-secondary/30 px-2 py-0.5 rounded-full">
                    {categoryProducts.length}
                 </span>
              </h2>

              {/* Сетка товаров */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
                {categoryProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          );
        })}

        {initialProducts.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
                Товары не найдены
            </div>
        )}
      </div>
    </div>
  );
}