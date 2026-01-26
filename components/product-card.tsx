"use client";

import { useState } from "react";
import Image from "next/image";
import { useCart } from "@/store/cart";
import { Button } from "@/components/ui/button";
import { Plus, Minus, ShoppingCart, Weight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
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

  const handleAdd = () => {
    const stepToAdd = product.step || 1;
    cart.addItem({
      id: product.id,
      name: product.name,
      priceRub: product.priceRub,
      unit: product.unit,
      image: product.imageUrl || undefined,
      step: product.step || undefined,
      quantity: stepToAdd,
    });
  };

  const handleRemove = () => cart.removeItem(product.id);

  return (
    <>
      <div
          className="group relative flex flex-col h-full bg-card rounded-2xl border border-border/50 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-primary/30 hover:-translate-y-1 overflow-hidden cursor-pointer"
          onClick={() => setIsModalOpen(true)}
      >

        {/* Фото */}
        <div className="relative aspect-[4/3] overflow-hidden bg-white">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground/30">
              <ShoppingBagIcon className="w-12 h-12" />
            </div>
          )}

          <div className="absolute top-3 left-3 z-10">
              {isWeighable ? (
                   <Badge variant="secondary" className="backdrop-blur-md bg-white/80 text-black shadow-sm font-medium">
                      <Weight className="w-3 h-3 mr-1" />
                      Весовой
                   </Badge>
              ) : null}
          </div>
        </div>

        {/* Контент */}
        <div className="flex flex-col flex-grow p-5 relative">
          <div className="flex-grow relative">
              <h3 className="font-bold text-xl leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
                {product.name}
              </h3>
              {product.description && (
                <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                  {product.description}
                </p>
              )}
          </div>

          {/* Цена и кнопки */}
          <div
             className="pt-4 mt-4 border-t border-border/50 flex items-center justify-between gap-2"
             onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-primary leading-none">
                {product.priceRub} ₽
              </span>
              <span className="text-xs text-muted-foreground font-medium mt-1">
                 {isWeighable ? "за 1 кг" : "за 1 шт."}
              </span>
            </div>

            {quantity === 0 ? (
              <Button
                  onClick={handleAdd}
                  size="icon"
                  className="h-11 w-11 rounded-full shadow-md transition-all active:scale-95 bg-primary hover:bg-primary/90 hover:shadow-lg"
              >
                <ShoppingCart className="h-5 w-5 text-white" />
              </Button>
            ) : (
              <div className="flex items-center gap-1 bg-secondary/60 rounded-full p-1 shadow-inner border border-border/50">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full bg-white shadow-sm hover:bg-white/90 transition-colors"
                  onClick={handleRemove}
                >
                  <Minus className="h-4 w-4" />
                </Button>

                {/* ИСПРАВЛЕНИЕ: Добавили подпись кг/шт */}
                <div className="flex flex-col items-center min-w-[2.5rem]">
                    <span className="text-center font-bold text-sm tabular-nums leading-none">
                    {isWeighable
                        ? (quantity).toFixed(2)
                        : quantity}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium">
                        {isWeighable ? "кг" : "шт"}
                    </span>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full bg-white shadow-sm hover:bg-white/90 transition-colors"
                  onClick={handleAdd}
                >
                  <Plus className="h-4 w-4" />
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