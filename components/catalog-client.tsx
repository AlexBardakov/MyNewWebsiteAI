'use client';

import { useState } from 'react';
// ИСПРАВЛЕННЫЙ ИМПОРТ (фигурные скобки):
import { ProductCard } from '@/components/product-card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
}

// ИСПРАВЛЕННАЯ ТИПИЗАЦИЯ (добавлены поля для корзины)
interface Product {
  id: string;
  name: string;
  priceRub: number;
  imageUrl: string | null;
  unit: string;
  description: string | null;
  avgPackWeightGrams: number | null; // <--- Нужно для ProductCard
  remainder: number;                 // <--- Нужно для ProductCard
  category?: {
    name: string;
  };
  categoryId: string;
}

interface CatalogClientProps {
  initialProducts: Product[];
  categories: Category[];
}

export default function CatalogClient({ initialProducts, categories }: CatalogClientProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Логика фильтрации на клиенте
  const filteredProducts = activeCategory === 'all'
    ? initialProducts
    : initialProducts.filter((p) => p.categoryId === activeCategory);

  return (
    <div className="space-y-8">
      {/* Фильтры (Категории) - скроллбар для мобильных */}
      <div className="flex flex-wrap gap-2 pb-2 overflow-x-auto no-scrollbar">
        <Button
          variant={activeCategory === 'all' ? 'default' : 'outline'}
          onClick={() => setActiveCategory('all')}
          className={cn(
            "rounded-full transition-all",
            activeCategory === 'all'
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "hover:border-primary hover:text-primary"
          )}
        >
          Все
        </Button>

        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant={activeCategory === cat.id ? 'default' : 'outline'}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              "rounded-full transition-all",
              activeCategory === cat.id
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "hover:border-primary hover:text-primary"
            )}
          >
            {cat.name}
          </Button>
        ))}
      </div>

      {/* Сетка товаров */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-secondary/20 rounded-xl border border-dashed">
          <p className="text-lg">В этой категории пока пусто 🧀</p>
        </div>
      )}
    </div>
  );
}