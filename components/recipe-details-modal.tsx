"use client";

import Image from "next/image";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ChefHat, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCart } from "@/store/cart";
import { toast } from "sonner";

export interface Recipe {
  id: string;
  title: string;
  shortDescription: string | null;
  coverUrl: string | null;
  previewImageUrl: string | null;
  ingredientsText: string | null;
  content: string | null;
  categoryId: string | null;
  category: { id: string; name: string } | null;
  // Добавляем массив продуктов, который приходит из Prisma
  recipeProducts: {
    productId: string;
    product: {
      id: string;
      name: string;
      imageUrl: string | null;
      priceRub: number;
      unit: string;
      avgPackWeightGrams: number | null;
      remainder: number;
    }
  }[];
  [key: string]: any;
}

interface RecipeDetailsModalProps {
  recipe: Recipe | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecipeDetailsModal({ recipe, open, onOpenChange }: RecipeDetailsModalProps) {
  const addItem = useCart((state) => state.addItem);

  if (!recipe) return null;

  // Функция добавления товара в корзину прямо из рецепта
  const handleAddProduct = (product: Recipe["recipeProducts"][0]["product"]) => {
    // Рассчитываем шаг (как в карточке товара)
    const step = product.unit === 'kg'
      ? (product.avgPackWeightGrams || 200) / 1000
      : 1;

    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      priceRub: product.priceRub,
      quantity: step,
      unit: product.unit,
      image: product.imageUrl || undefined,
      step: step,
    });
    
    toast.success(`${product.name} добавлен в корзину`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-5xl w-[95vw] p-0 gap-0 bg-white rounded-2xl border-none shadow-xl flex flex-col md:flex-row h-[90vh] md:h-[85vh] overflow-hidden">

        <DialogTitle className="sr-only">{recipe.title}</DialogTitle>
        <DialogDescription className="sr-only">Детали рецепта</DialogDescription>

        {/* Кнопка закрытия для мобильных (поверх фото) */}
        <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 z-50 p-2 bg-black/5 hover:bg-black/10 rounded-full transition-colors backdrop-blur-sm md:hidden"
        >
            <X className="w-5 h-5 text-black/70" />
        </button>

        {/* ЛЕВАЯ ЧАСТЬ (Фото) */}
        <div className="relative w-full md:w-[45%] h-[250px] md:h-full bg-secondary/10 flex-shrink-0">
          {recipe.coverUrl || recipe.previewImageUrl ? (
            <Image
              src={recipe.coverUrl || recipe.previewImageUrl || ""}
              alt={recipe.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 45vw"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground/20">
              <ChefHat className="w-20 h-20" />
            </div>
          )}

          {/* Категория поверх фото */}
          {recipe.category && (
             <div className="absolute top-4 left-4">
                <Badge variant="secondary" className="bg-white/90 text-black shadow-sm text-xs px-2 py-0.5 backdrop-blur-md border-0">
                   {recipe.category.name}
                </Badge>
            </div>
          )}
        </div>

        {/* ПРАВАЯ ЧАСТЬ (Контент) */}
        <div className="flex flex-col w-full md:w-[55%] bg-white h-full overflow-hidden">

           {/* Область прокрутки занимает всё доступное место (flex-1) */}
           <ScrollArea className="flex-1 w-full">
             <div className="p-6 md:p-8 space-y-6">

                {/* Заголовок */}
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold leading-tight text-gray-900 mb-2">
                      {recipe.title}
                  </h2>
                  {recipe.shortDescription && (
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {recipe.shortDescription}
                    </p>
                  )}
                </div>

                <div className="h-px bg-gray-100 w-full" />

                {/* Ингредиенты */}
                {recipe.ingredientsText && (
                  <div className="bg-orange-50/50 rounded-xl p-5 border border-orange-100/50">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-orange-800 mb-3 flex items-center gap-2">
                      📋 Ингредиенты
                    </h3>
                    <div className="prose prose-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-medium">
                      {recipe.ingredientsText}
                    </div>
                  </div>
                )}

                {/* Способ приготовления */}
                {recipe.content && (
                   <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                        👨‍🍳 Способ приготовления
                      </h3>
                      <div className="prose prose-gray max-w-none text-gray-600 leading-relaxed whitespace-pre-wrap">
                        {recipe.content}
                      </div>
                   </div>
                )}

                {/* СЕКЦИЯ СЫРОВ (Добавлено) */}
                {recipe.recipeProducts && recipe.recipeProducts.length > 0 && (
                    <>
                        <div className="h-px bg-gray-100 w-full mt-6" />
                        <div className="pt-2">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                               🧀 Рекомендуемые сыры
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {recipe.recipeProducts.map(({ product }) => (
                                    <div key={product.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:border-primary/20 transition-colors">
                                        {/* Мини-фото товара */}
                                        <div className="w-12 h-12 rounded-lg bg-white overflow-hidden relative flex-shrink-0 border">
                                            {product.imageUrl ? (
                                                <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-secondary/10 text-xs">🧀</div>
                                            )}
                                        </div>
                                        
                                        {/* Название и цена */}
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-sm truncate" title={product.name}>
                                                {product.name}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {product.priceRub} ₽ / {product.unit === 'kg' ? 'кг' : 'шт'}
                                            </div>
                                        </div>

                                        {/* Кнопка купить */}
                                        <Button 
                                            size="icon" 
                                            variant="secondary" 
                                            className="h-8 w-8 rounded-full shadow-sm hover:bg-primary hover:text-white transition-colors"
                                            onClick={() => handleAddProduct(product)}
                                            disabled={product.remainder <= 0}
                                            title="В корзину"
                                        >
                                            <ShoppingCart className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

             </div>
           </ScrollArea>

           {/* Футер (Кнопка Закрыть на ПК) - зафиксирован внизу */}
           <div className="p-4 border-t bg-gray-50/50 hidden md:flex justify-end flex-shrink-0">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Закрыть
              </Button>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}