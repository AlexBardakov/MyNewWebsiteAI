"use client";

import { useState } from "react";
import Image from "next/image";
import { useCart } from "@/store/cart";
import { Button } from "@/components/ui/button";
import { Plus, Minus, ShoppingCart, Weight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProductDetailsModal, Product } from "@/components/product-details-modal";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const cart = useCart();

  const cartItem = cart.items.find((item) => item.id === product.id);
  const quantity = cartItem?.quantity ?? 0;
  const isWeighable = product.unit === "kg";

  // ИСПРАВЛЕНИЕ: Рассчитываем шаг прямо здесь, не полагаясь на пропсы сервера
  const step = isWeighable && product.avgPackWeightGrams && product.avgPackWeightGrams > 0
      ? product.avgPackWeightGrams / 1000 // Например: 300г -> 0.3кг
      : (isWeighable ? 0.5 : 1); // Дефолт: 0.5кг для весовых, 1шт для штучных

  const handleAdd = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    cart.addItem({
      id: product.id,
      name: product.name,
      priceRub: product.priceRub,
      unit: product.unit,
      image: product.imageUrl || undefined,
      step: step,
      quantity: step,
    });
  };

  const handleRemove = (e: React.MouseEvent) => {
      e.stopPropagation();

      // Логика уменьшения: если осталось <= 1 шага, удаляем, иначе отнимаем шаг
      if (quantity - step <= 0.001) {
          cart.removeItem(product.id);
      } else {
          const newQty = quantity - step;
          cart.updateQuantity(product.id, Number(newQty.toFixed(3)));
      }
  };

  return (
    <>
      <div
          className="group relative flex flex-col h-full bg-card rounded-xl border border-border/40 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer"
          onClick={() => setIsModalOpen(true)}
      >
        {/* Фото */}
        <div className="relative aspect-square overflow-hidden bg-secondary/5">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground/20">
              <ShoppingBagIcon className="w-10 h-10" />
            </div>
          )}

          {isWeighable && (
             <div className="absolute top-2 left-2 z-10">
                 <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-white/90 backdrop-blur-sm shadow-sm border-0">
                    <Weight className="w-3 h-3 mr-1 opacity-70" />
                    Весовой
                 </Badge>
             </div>
          )}
        </div>

        {/* Контент */}
        <div className="flex flex-col flex-grow p-3 md:p-4 gap-2">
          <div className="flex-grow">
              <h3 className="font-semibold text-sm md:text-base leading-tight group-hover:text-primary transition-colors line-clamp-2">
                {product.name}
              </h3>

              {product.description ? (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-snug">
                  {product.description}
                </p>
              ) : null}
          </div>

          {/* Цена и кнопки */}
          <div className="mt-auto flex items-end justify-between gap-2 pt-1">
            <div className="flex flex-col">
              <span className="text-lg md:text-xl font-bold text-primary leading-none">
                {product.priceRub} ₽
              </span>
              <span className="text-[10px] md:text-xs text-muted-foreground font-medium mt-0.5">
                 {/* Показываем реальный шаг (например, "за 0.3 кг") вместо просто "за 1 кг" */}
                 {isWeighable
                    ? `за ${step === 1 ? '1' : step} кг`
                    : "за 1 шт."}
              </span>
            </div>

            {quantity === 0 ? (
              <Button
                  onClick={handleAdd}
                  size="icon"
                  className="h-8 w-8 md:h-9 md:w-9 rounded-full shadow-sm bg-primary hover:bg-primary/90 shrink-0 transition-transform active:scale-95"
              >
                <ShoppingCart className="h-4 w-4 md:h-5 md:w-5 text-white" />
              </Button>
            ) : (
              <div className="flex items-center gap-1 bg-secondary/50 rounded-full p-0.5 shadow-inner border border-border/50 shrink-0" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-white shadow-sm hover:bg-red-50 hover:text-red-500 transition-colors"
                  onClick={handleRemove}
                >
                  <Minus className="h-3 w-3 md:h-4 md:w-4" />
                </Button>

                <div className="flex flex-col items-center min-w-[1.5rem] md:min-w-[2rem]">
                    <span className="text-center font-bold text-xs md:text-sm tabular-nums leading-none">
                    {isWeighable
                        ? (quantity).toFixed(1)
                        : quantity}
                    </span>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-white shadow-sm hover:bg-green-50 hover:text-green-600 transition-colors"
                  onClick={handleAdd}
                >
                  <Plus className="h-3 w-3 md:h-4 md:w-4" />
                </Button>
              </div>
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

function ShoppingBagIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
    )
}