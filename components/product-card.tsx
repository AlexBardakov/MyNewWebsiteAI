"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/store/cart"; // <--- Исправляем импорт
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    priceRub: number;
    unit: string;
    imageUrl: string | null;
    avgPackWeightGrams: number | null; // Важно для шага
    remainder: number;
    // ... остальные поля
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCart((state) => state.addItem);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Чтобы не переходить по ссылке при клике на кнопку

    // Вычисляем шаг (как мы делали в product-actions)
    const step = product.unit === 'pcs'
      ? 1
      : (product.avgPackWeightGrams || 100);

    addItem({
      id: product.id,
      name: product.name,
      priceRub: product.priceRub,
      quantity: step, // Добавляем сразу один "шаг" (или кусок)
      unit: product.unit,
      image: product.imageUrl || undefined,
      step: step,
    });

    toast.success(`В корзину: ${product.name}`);
  };

  return (
    <Link href={`/product/${product.id}`} className="group block h-full">
      <div className="flex h-full flex-col overflow-hidden rounded-lg border bg-white shadow-sm transition-all hover:shadow-md">
        {/* Картинка */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
             <div className="flex h-full items-center justify-center text-gray-400">Нет фото</div>
          )}
        </div>

        {/* Контент */}
        <div className="flex flex-1 flex-col p-4">
          <h3 className="mb-2 text-lg font-medium text-gray-900 line-clamp-2">
            {product.name}
          </h3>

          <div className="mt-auto flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xl font-bold text-gray-900">
                {product.priceRub} ₽
              </span>
              <span className="text-sm text-muted-foreground">
                за {product.unit === 'kg' ? 'кг' : 'шт'}
              </span>
            </div>

            {product.remainder > 0 ? (
                <Button size="icon" onClick={handleAddToCart}>
                  <Plus className="h-5 w-5" />
                </Button>
            ) : (
                <span className="text-xs font-medium text-red-500 bg-red-50 px-2 py-1 rounded">
                    Нет в наличии
                </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}