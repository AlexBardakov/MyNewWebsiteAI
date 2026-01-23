"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/store/cart";
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
    avgPackWeightGrams: number | null;
    remainder: number;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCart((state) => state.addItem);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();

    // ИСПРАВЛЕНИЕ: Если товар весовой, переводим граммы в КГ (делим на 1000)
    // Если avgPackWeightGrams нет, берем 100г (0.1 кг)
    const step = product.unit === 'pcs'
      ? 1
      : (product.avgPackWeightGrams || 100) / 1000;

    addItem({
      id: product.id,
      name: product.name,
      priceRub: product.priceRub,
      quantity: step,
      unit: product.unit,
      image: product.imageUrl || undefined,
      step: step,
    });

    toast.success(`В корзину: ${product.name}`);
  };

  return (
    <Link href={`/product/${product.id}`} className="group block h-full">
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border-none bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">

        {/* Картинка */}
        <div className="relative aspect-square overflow-hidden bg-secondary/30">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
             <div className="flex h-full items-center justify-center text-muted-foreground">Нет фото</div>
          )}

          {product.remainder <= 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm">
                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-600">
                    Раскупили
                </span>
            </div>
          )}
        </div>

        {/* Контент */}
        <div className="flex flex-1 flex-col p-5">
          <h3 className="mb-2 text-lg font-medium leading-tight text-gray-900 group-hover:text-primary transition-colors">
            {product.name}
          </h3>

          <div className="mt-auto pt-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xl font-bold text-gray-900">
                {product.priceRub} ₽
              </span>
              <span className="text-xs text-muted-foreground">
                за {product.unit === 'kg' ? 'кг' : 'шт'}
              </span>
            </div>

            {product.remainder > 0 && (
                <Button
                  size="icon"
                  onClick={handleAddToCart}
                  className="h-10 w-10 rounded-full shadow-sm hover:shadow-md transition-shadow"
                >
                  <Plus className="h-5 w-5" />
                </Button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}