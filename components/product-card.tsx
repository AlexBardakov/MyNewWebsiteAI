'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react'; // Убедитесь, что lucide-react установлен
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/store/cart';
import { cn, formatPrice } from '@/lib/utils'; // formatPrice мы добавили в прошлом шаге в utils

// Временный интерфейс, пока Prisma типы не подтянулись глобально
interface ProductProps {
  id: string;
  name: string;
  description: string | null;
  priceRub: number;
  imageUrl: string | null;
  unit: string;
  category?: { name: string };
  isNew?: boolean; // Можно вычислять по дате
}

export default function ProductCard({ product }: { product: ProductProps }) {
  const addItem = useCartStore((state) => state.addItem);

  // Обработчик добавления в корзину (чтобы не переходило на страницу товара)
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem(product);
  };

  return (
    <Link href={`/product/${product.id}`}>
      <Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-300 group cursor-pointer overflow-hidden border-border/50">
        <div className="relative aspect-square overflow-hidden bg-secondary/20">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Нет фото
            </div>
          )}
          {product.category && (
            <Badge variant="secondary" className="absolute top-2 left-2 opacity-90">
              {product.category.name}
            </Badge>
          )}
        </div>
        
        <CardContent className="flex-1 p-4">
          <h3 className="font-semibold text-lg line-clamp-1 mb-1 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 h-10 mb-2">
            {product.description || 'Вкуснейший сыр, который стоит попробовать.'}
          </p>
          <div className="font-bold text-xl">
            {formatPrice(product.priceRub)} 
            <span className="text-sm font-normal text-muted-foreground ml-1">
              / {product.unit === 'kg' ? 'кг' : 'шт'}
            </span>
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 mt-auto">
          <Button 
            onClick={handleAddToCart} 
            className="w-full gap-2 transition-all active:scale-95"
          >
            <ShoppingCart size={16} />
            В корзину
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}