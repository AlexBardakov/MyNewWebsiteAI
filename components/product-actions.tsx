"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/store/cart";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

interface ProductActionsProps {
  product: {
    id: string;
    name: string;
    priceRub: number;
    unit: string;
    imageUrl: string | null;
    avgPackWeightGrams: number | null; // <--- Получаем вес
    remainder: number;
  };
}

export function ProductActions({ product }: ProductActionsProps) {
  const addItem = useCart((state) => state.addItem);

  // Вычисляем шаг
  const step = product.unit === 'pcs'
    ? 1
    : (product.avgPackWeightGrams || 100); // Если вес не задан, шаг 100г

  const [quantity, setQuantity] = useState(step);

  const handleIncrement = () => setQuantity((prev) => prev + step);

  const handleDecrement = () => {
    setQuantity((prev) => (prev > step ? prev - step : step));
  };

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      priceRub: product.priceRub,
      quantity: quantity,
      image: product.imageUrl || undefined,
      unit: product.unit,
      step: step, // <--- Сохраняем шаг в корзину
    });

    // Форматируем сообщение
    const qtyText = product.unit === 'kg' ? `${quantity} г` : `${quantity} шт`;
    toast.success(`Добавлено: ${qtyText}`);
  };

  if (product.remainder <= 0) {
     return <Button disabled className="w-full">Нет в наличии</Button>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center rounded-md border">
          <Button variant="ghost" size="icon" onClick={handleDecrement} disabled={quantity <= step}>
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-16 text-center font-medium">
            {product.unit === 'kg' ? `${quantity} г` : quantity}
          </span>
          <Button variant="ghost" size="icon" onClick={handleIncrement}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          {product.unit === 'kg' && `~ ${(product.priceRub * quantity / 1000).toFixed(0)} ₽`}
          {product.unit === 'pcs' && `${product.priceRub * quantity} ₽`}
        </div>
      </div>

      <Button size="lg" className="w-full" onClick={handleAddToCart}>
        <ShoppingCart className="mr-2 h-5 w-5" />
        В корзину
      </Button>
    </div>
  );
}