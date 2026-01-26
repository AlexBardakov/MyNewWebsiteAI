"use client";

import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Minus, ShoppingCart, Weight, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/store/cart";
import { cn } from "@/lib/utils";

export interface Product {
  id: string;
  name: string;
  description: string | null;
  priceRub: number;
  imageUrl: string | null;
  unit: string;
  step?: number | null;
  categoryId?: string;
  [key: string]: any;
}

interface ProductDetailsModalProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductDetailsModal({ product, open, onOpenChange }: ProductDetailsModalProps) {
  const cart = useCart();
  const cartItem = cart.items.find((item) => item.id === product.id);

  const step = product.step || 1;
  const quantity = cartItem?.quantity ?? 0;
  const isWeighable = product.unit === "kg";

  const handleAdd = () => {
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

  const handleRemove = () => {
     if (quantity - step <= 0.0001) {
         cart.removeItem(product.id);
     } else {
         const newQty = quantity - step;
         cart.updateQuantity(product.id, Number(newQty.toFixed(3)));
     }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] p-0 gap-0 overflow-hidden bg-white sm:rounded-3xl border-none shadow-2xl h-[90vh] md:h-[600px] flex flex-col md:block">

        <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 z-50 p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors backdrop-blur-sm"
        >
            <X className="w-5 h-5 text-black/70" />
        </button>

        {/* АДАПТИВНАЯ СЕТКА: На мобильном flex-col, на десктопе grid */}
        <div className="flex flex-col md:grid md:grid-cols-[55%_45%] h-full">

          {/* ЛЕВАЯ ЧАСТЬ: Фото */}
          {/* На мобильном фиксированная высота, на десктопе полная */}
          <div className="relative w-full h-[250px] md:h-full bg-secondary/10 flex-shrink-0">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 60vw"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground/20">
                <Weight className="w-24 h-24" />
              </div>
            )}

             <div className="absolute top-5 left-5">
                <Badge className="bg-white/90 text-black hover:bg-white shadow-sm text-sm px-3 py-1 backdrop-blur-md border-0">
                   {isWeighable ? "Весовой товар" : "Штучный товар"}
                </Badge>
            </div>
          </div>

          {/* ПРАВАЯ ЧАСТЬ: Контент */}
          <div className="flex flex-col h-full bg-white overflow-hidden">

             {/* Скролл контента */}
             <div className="flex-grow overflow-y-auto custom-scrollbar p-6 md:p-10">
                <DialogHeader className="mb-4 md:mb-6 space-y-2 md:space-y-4 text-left">
                    <DialogTitle className="text-2xl md:text-4xl font-bold leading-tight text-gray-900">
                        {product.name}
                    </DialogTitle>

                    <div className="flex items-baseline gap-2">
                         <span className="text-2xl md:text-3xl font-bold text-primary">
                            {product.priceRub} ₽
                         </span>
                         <span className="text-base md:text-lg text-muted-foreground font-medium">
                            / {isWeighable ? "1 кг" : "1 шт."}
                         </span>
                    </div>
                </DialogHeader>

                <div className="prose prose-stone max-w-none text-sm md:text-base">
                   {product.description ? (
                      <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                        {product.description}
                      </p>
                   ) : (
                     <p className="text-muted-foreground italic">Описание отсутствует</p>
                   )}
                </div>

                {isWeighable && (
                    <div className="mt-6 p-4 bg-blue-50/50 rounded-xl border border-blue-100 text-blue-800 text-xs md:text-sm">
                        ℹ️ <b>Весовой товар:</b> Шаг заказа примерно <b>{step} кг</b>. Итоговый вес может незначительно отличаться.
                    </div>
                )}
             </div>

             {/* Футер */}
             <div className="p-4 md:p-8 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-4 items-center justify-between flex-shrink-0">

                <div className="flex flex-col items-center sm:items-start w-full sm:w-auto">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 hidden sm:block">
                        Сумма
                    </span>
                    <span className="text-xl md:text-2xl font-bold text-gray-900 tabular-nums">
                        {quantity > 0
                            ? Math.round(quantity * product.priceRub).toLocaleString('ru-RU')
                            : "0"} ₽
                    </span>
                </div>

                {quantity === 0 ? (
                    <Button
                        onClick={handleAdd}
                        size="lg"
                        className="w-full sm:w-auto rounded-xl h-12 md:h-14 text-base md:text-lg shadow-lg shadow-primary/20"
                    >
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      В корзину
                    </Button>
                  ) : (
                    <div className="flex items-center gap-3 bg-white rounded-xl p-1.5 shadow-sm border border-gray-200 w-full sm:w-auto justify-between sm:justify-start">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 md:h-11 md:w-11 rounded-lg hover:bg-gray-100 text-gray-600"
                        onClick={handleRemove}
                      >
                        <Minus className="h-5 w-5" />
                      </Button>

                      <div className="flex flex-col items-center min-w-[4rem]">
                          <span className="font-bold text-lg md:text-xl tabular-nums leading-none">
                            {isWeighable
                                ? quantity.toFixed(3)
                                : quantity}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-medium uppercase mt-0.5">
                            {isWeighable ? "кг" : "шт"}
                          </span>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 md:h-11 md:w-11 rounded-lg hover:bg-gray-100 text-gray-600"
                        onClick={handleAdd}
                      >
                        <Plus className="h-5 w-5" />
                      </Button>
                    </div>
                  )}
            </div>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}