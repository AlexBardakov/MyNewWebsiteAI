"use client";

import { useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Minus, ShoppingCart, X, Weight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label"; // Добавили Label для красоты
import { useCart } from "@/store/cart";
import { toast } from "sonner"; // Добавляем тосты для уведомлений

export interface Product {
  id: string;
  name: string;
  description: string | null;
  priceRub: number;
  imageUrl: string | null;
  unit: string;
  avgPackWeightGrams?: number | null;
  step?: number | null;
  categoryId?: string;
  variants?: { id: string; name: string }[]; // Добавили массив вариантов
  [key: string]: any;
}

interface ProductDetailsModalProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductDetailsModal({ product, open, onOpenChange }: ProductDetailsModalProps) {
  const cart = useCart();

  // Состояние для выбранного варианта
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(undefined);

  const isWeighable = product.unit === "kg";
  const hasVariants = product.variants && product.variants.length > 0;

  // ИСПРАВЛЕНИЕ: Расчет шага
  const step = isWeighable && product.avgPackWeightGrams && product.avgPackWeightGrams > 0
      ? product.avgPackWeightGrams / 1000
      : (isWeighable ? 0.5 : 1);

  // --- ЛОГИКА ВАРИАНТОВ ---
  // Находим имя выбранного варианта
  const selectedVariantName = hasVariants
    ? product.variants?.find(v => v.id === selectedVariantId)?.name
    : undefined;

  // Формируем ID для поиска в корзине.
  // Если вариант выбран -> "ID_ТОВАРА::ВАРИАНТ"
  // Если вариантов нет -> "ID_ТОВАРА"
  const cartItemId = hasVariants && selectedVariantName
      ? `${product.id}::${selectedVariantName}`
      : product.id;

  // Ищем конкретную позицию в корзине
  const cartItem = cart.items.find((item) => item.id === cartItemId);
  const quantity = cartItem?.quantity ?? 0;

  const handleAdd = () => {
    // Если есть варианты, но пользователь ничего не выбрал
    if (hasVariants && !selectedVariantId) {
        toast.error("Пожалуйста, выберите вариант");
        return;
    }

    cart.addItem({
      id: cartItemId,          // Уникальный ID (возможно составной)
      productId: product.id,   // Реальный ID товара
      name: product.name,
      variant: selectedVariantName, // Имя варианта (если есть)
      priceRub: product.priceRub,
      unit: product.unit,
      image: product.imageUrl || undefined,
      step: step,
      quantity: step,
    });
  };

  const handleRemove = () => {
     if (quantity - step <= 0.001) {
         cart.removeItem(cartItemId); // Удаляем по cartItemId
     } else {
         const newQty = quantity - step;
         cart.updateQuantity(cartItemId, Number(newQty.toFixed(3)));
     }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* DialogContent — современный mobile bottom-sheet паттерн:
          - Mobile (по умолчанию): h-[95dvh] — почти весь экран (dvh = dynamic viewport
            height, учитывает мобильные UI-бары браузера, в отличие от vh).
          - Desktop (md+): h-auto + max-h-[88vh] — авто по контенту, но не больше 88%.
          - overflow-hidden на корне + flex-1 + overflow-y-auto на контенте даёт
            корректный внутренний скролл, без потери футера за пределами экрана. */}
      <DialogContent
        className="!max-w-4xl w-[95vw] p-0 gap-0 bg-card rounded-2xl border-none shadow-xl
                   flex flex-col md:flex-row md:items-stretch
                   h-[95dvh] md:h-auto md:max-h-[88vh]
                   overflow-hidden"
      >

        <DialogTitle className="sr-only">{product.name}</DialogTitle>
        <DialogDescription className="sr-only">Детали товара</DialogDescription>

        <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 z-50 p-2 bg-background/70 hover:bg-background/90 rounded-full transition-colors backdrop-blur-sm md:hidden"
        >
            <X className="w-5 h-5 text-foreground/80" />
        </button>

        {/* ЛЕВАЯ ЧАСТЬ (Фото) — на мобиле фиксированная высота, на десктопе квадрат.
            flex-shrink-0 чтобы фото не сжималось при нехватке места. */}
        <div className="relative w-full md:w-[40%] h-[220px] sm:h-[260px] md:h-auto md:aspect-square bg-secondary/10 flex-shrink-0 overflow-hidden rounded-t-2xl md:rounded-2xl md:m-1">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 40vw"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground/20">
              <Weight className="w-20 h-20" />
            </div>
          )}

           <div className="absolute top-4 left-4">
              <Badge variant="secondary" className="bg-background/85 text-foreground shadow-sm text-xs px-2 py-0.5 backdrop-blur-md border border-border">
                 {isWeighable ? "Весовой" : "Штучный"}
              </Badge>
          </div>
        </div>

        {/* ПРАВАЯ ЧАСТЬ (Контент) — критичные классы для корректного скролла:
            - flex-1 — занимает оставшееся пространство в родительском flex;
            - min-h-0 — позволяет flex-child быть МЕНЬШЕ своего контента
              (без этого default min-height: auto не даст overflow-y-auto работать);
            - overflow-hidden — обрезает выходящий контент, чтобы внутренний скролл взял на себя. */}
        <div className="flex flex-col w-full md:w-[60%] flex-1 min-h-0 bg-card overflow-hidden rounded-b-2xl md:rounded-r-2xl">

           {/* Скроллируемая область — flex-1 занимает всё свободное пространство
               после футера. max-h убран — высота вычисляется автоматически. */}
           <div className="flex-1 overflow-y-auto custom-scrollbar p-5 md:p-8">
              <div className="mb-1">
                 {product.category && (
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {product.category.name}
                    </span>
                 )}
              </div>

              <h2 className="text-2xl md:text-3xl leading-tight text-foreground mb-2">
                  {product.name}
              </h2>

              <div className="flex items-baseline gap-2 mb-4">
                   <span className="text-xl md:text-2xl font-bold text-primary">
                      {product.priceRub} ₽
                   </span>
                   <span className="text-sm text-muted-foreground">
                      / {isWeighable ? "1 кг" : "1 шт."}
                   </span>
              </div>

              {/* СЕКЦИЯ ВЫБОРА ВАРИАНТА */}
              {hasVariants && (
                <div className="mb-6 space-y-3 p-4 bg-secondary/10 rounded-xl border border-secondary/20">
                  <Label className="text-sm font-semibold text-foreground/80">
                    Выберите вариант:
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {product.variants!.map((v) => {
                      const isSelected = selectedVariantId === v.id;
                      return (
                        <div
                          key={v.id}
                          onClick={() => setSelectedVariantId(v.id)}
                          className={`
                            cursor-pointer px-3 py-1.5 rounded-md text-sm font-medium transition-all border select-none
                            ${isSelected
                                ? "bg-primary text-primary-foreground border-primary shadow-sm scale-105"
                                : "bg-card text-foreground border-border hover:border-primary/50 hover:bg-secondary/20"}
                          `}
                        >
                          {v.name}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="prose prose-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                 {product.description || "Описание отсутствует."}
              </div>

              {isWeighable && (
                  <div className="mt-6 p-3 bg-secondary/40 border border-border rounded-lg text-foreground/80 text-xs md:text-sm leading-snug">
                      ℹ️ Цена указана за 1 кг. Минимальный шаг заказа для этого товара: <b>{step} кг</b>.
                  </div>
              )}
           </div>

           {/* Футер — flex-shrink-0 чтобы никогда не сжимался и оставался видимым.
               Это решает баг "невозможно докрутить до кнопки В корзину" на мобиле. */}
           <div className="flex-shrink-0 p-4 md:p-5 border-t border-border bg-muted/30 flex items-center justify-between gap-3 rounded-b-2xl md:rounded-br-2xl md:rounded-bl-none">

              {/* Сумма — компактнее на мобиле, чтобы оставалось место для кнопки. */}
              <div className="flex flex-col items-start flex-shrink-0">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                      Сумма
                  </span>
                  <span className="text-lg sm:text-xl font-bold text-foreground tabular-nums leading-tight">
                      {quantity > 0
                          ? Math.round(quantity * product.priceRub).toLocaleString('ru-RU')
                          : "0"} ₽
                  </span>
              </div>

              {/* Кнопка / +- контролы — flex-1 чтобы занимать оставшееся место,
                  на десктопе можно ограничить max-w. */}
              <div className="flex-1 max-w-[260px]">
                  {quantity === 0 ? (
                    <Button
                        onClick={handleAdd}
                        size="lg"
                        className="w-full h-11 rounded-xl shadow-md font-semibold text-sm sm:text-base"
                        // Блокируем кнопку, если вариант не выбран
                        disabled={hasVariants && !selectedVariantId}
                    >
                      <ShoppingCart className="h-5 w-5 mr-2 flex-shrink-0" />
                      <span className="truncate">
                        {hasVariants && !selectedVariantId ? "Выберите вариант" : "В корзину"}
                      </span>
                    </Button>
                  ) : (
                    <div className="flex items-center justify-between gap-2 bg-card rounded-xl p-1 shadow-sm border border-border min-w-[140px]">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 flex-shrink-0 rounded-lg hover:bg-secondary"
                        onClick={handleRemove}
                      >
                        <Minus className="h-5 w-5" />
                      </Button>

                      <div className="flex flex-col items-center min-w-[3rem]">
                          <span className="font-bold text-lg tabular-nums leading-none">
                            {isWeighable
                                ? quantity.toFixed(3) // 3 знака для точности
                                : quantity}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-medium uppercase mt-0.5">
                            {isWeighable ? "кг" : "шт"}
                          </span>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 flex-shrink-0 rounded-lg hover:bg-secondary"
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