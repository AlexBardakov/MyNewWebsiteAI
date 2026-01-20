'use client';

import { useState } from 'react';
import ProductCard from '@/components/product-card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
}

// Типизация продукта должна совпадать с тем, что возвращает Prisma
interface Product {
  id: string;
  name: string;
  priceRub: number;
  imageUrl: string | null;
  unit: string;
  description: string | null;
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

  // Логика фильтрации
  const filteredProducts = activeCategory === 'all'
    ? initialProducts
    : initialProducts.filter((p) => p.categoryId === activeCategory);

  return (
    <div className="space-y-8">
      {/* Фильтры (Категории) */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={activeCategory === 'all' ? 'default' : 'outline'}
          onClick={() => setActiveCategory('all')}
          className="rounded-full"
        >
          Все
        </Button>
        
        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant={activeCategory === cat.id ? 'default' : 'outline'}
            onClick={() => setActiveCategory(cat.id)}
            className="rounded-full"
          >
            {cat.name}
          </Button>
        ))}
      </div>

      {/* Сетка товаров */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-muted-foreground">
          В этой категории пока нет товаров.
        </div>
      )}
    </div>
  );
}