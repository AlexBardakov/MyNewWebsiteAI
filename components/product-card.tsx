'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Product } from '@/components/catalog-client';
import { Button } from '@/components/ui/button';
import { useCart } from '@/store/cart';
import { Minus, Plus, ShoppingCart, List } from 'lucide-react';
import { ProductDetailsModal } from '@/components/product-details-modal';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface Props {
  product: Product; // Используем базовый интерфейс, в нем уже есть variants
}

export function ProductCard({ product }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { items, addItem, removeItem, updateQuantity } = useCart();

  // Проверяем, есть ли варианты (безопасная проверка, даже если придет пустой массив или undefined)
  const hasVariants = product.variants && product.variants.length > 0;

  // Логика поиска в корзине актуальна только для простых товаров без вариантов.
  const cartItem = !hasVariants ? items.find((i) => i.id === product.id) : null;
  const isInCart = !!cartItem;

  // Рассчитываем шаг
  const step =
    product.unit === 'kg'
      ? (product.avgPackWeightGrams && product.avgPackWeightGrams > 0
          ? product.avgPackWeightGrams
          : 200) / 1000
      : 1;

  // Проверка наличия
  const isOutOfStock = Number(product.remainder) <= 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (hasVariants) {
      setIsModalOpen(true);
      return;
    }

    // Иначе добавляем стандартный товар
    addItem({
      id: product.id,
      productId: product.id, // <--- ДОБАВЛЕНО (Обязательное поле для корзины)
      name: product.name,
      priceRub: product.priceRub,
      quantity: step,
      unit: product.unit,
      image: product.imageUrl || undefined,
      step: step,
    });
  };

  const handleIncrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (cartItem) {
      updateQuantity(product.id, cartItem.quantity + step);
    }
  };

  const handleDecrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (cartItem) {
      if (cartItem.quantity - step < 0.001) {
        removeItem(product.id);
      } else {
        updateQuantity(product.id, cartItem.quantity - step);
      }
    }
  };

  return (
    <>
      <div
        className="group flex flex-col h-full rounded-2xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md cursor-pointer overflow-hidden"
        onClick={() => setIsModalOpen(true)}
      >
        {/* Блок изображения */}
        <div className="relative aspect-square w-full overflow-hidden bg-secondary/20">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className={cn(
                "object-cover transition-transform duration-300 group-hover:scale-105",
                isOutOfStock && "blur-[3px] opacity-70 grayscale-[20%]"
              )}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              Нет фото
            </div>
          )}

          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center p-4 text-center z-10">
              <span className="text-[#be123c]/90 font-semibold text-sm sm:text-base leading-snug bg-white/50 px-4 py-2.5 rounded-2xl backdrop-blur-md border border-white/40 shadow-sm transition-all select-none">
                Так вкусно,<br />что всё съели!
              </span>
            </div>
          )}
        </div>

        {/* Контент карточки */}
        <div className="flex flex-1 flex-col p-4 gap-2">
          <div className="flex-1">
            <h3 className="font-semibold leading-tight line-clamp-2" title={product.name}>
              {product.name}
            </h3>
          </div>

          {/* Блок цены и шага */}
          <div className="mt-2 space-y-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold">
                {product.priceRub.toLocaleString('ru-RU')} ₽
              </span>
              <span className="text-sm text-muted-foreground">
                / {product.unit === 'kg' ? 'кг' : 'шт.'}
              </span>
            </div>

            {product.unit === 'kg' && !isOutOfStock && (
              <div className="text-xs text-muted-foreground font-medium">
                Шаг ≈ {step.toLocaleString('ru-RU')} кг
              </div>
            )}
          </div>

          {/* Кнопки действий */}
          <div className="mt-2 pt-2 border-t border-dashed">
            {isOutOfStock ? (
               <Button disabled variant="outline" className="w-full opacity-50 cursor-not-allowed">
                 Нет в наличии
               </Button>
            ) : hasVariants ? (
              <Button
                className="w-full gap-2 font-semibold bg-primary/90 hover:bg-primary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsModalOpen(true);
                }}
              >
                <List className="h-4 w-4" />
                Выбрать
              </Button>
            ) : isInCart ? (
              <div className="flex items-center justify-between bg-secondary/30 rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-md bg-white shadow-sm hover:bg-white/90"
                  onClick={handleDecrease}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-sm font-semibold w-full text-center">
                  {cartItem.quantity.toLocaleString('ru-RU')} {product.unit === 'kg' ? 'кг' : 'шт'}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-md bg-white shadow-sm hover:bg-white/90"
                  onClick={handleIncrease}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                className="w-full gap-2 font-semibold"
                size="sm"
                onClick={handleAdd}
              >
                <ShoppingCart className="h-4 w-4" />
                В корзину
              </Button>
            )}
          </div>
        </div>
      </div>

      <ProductDetailsModal
        product={product}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  );
}