'use client';

import { useState } from 'react';
import { useCart } from '@/store/cart';
import { Button } from '@/components/ui/button';
import { Minus, Plus, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

interface ProductActionsProps {
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

export function ProductActions({ product }: ProductActionsProps) {
  const addItem = useCart((state) => state.addItem);

  // 1. Считаем шаг.
  // Если штуки -> 1
  // Если вес -> переводим граммы в КГ (например, 250г -> 0.25 кг)
  const step = product.unit === 'pcs'
    ? 1
    : (product.avgPackWeightGrams || 100) / 1000;

  // 2. Инициализируем количество сразу правильным шагом
  const [quantity, setQuantity] = useState(step);

  const handleIncrement = () => {
    // Округляем, чтобы не вылезали хвосты типа 0.300000004
    setQuantity((prev) => Number((prev + step).toFixed(3)));
  };

  const handleDecrement = () => {
    setQuantity((prev) => {
      const newVal = prev - step;
      return newVal < step ? step : Number(newVal.toFixed(3));
    });
  };

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      productId: product.id, // <--- ДОБАВЛЕНА ЭТА СТРОКА
      name: product.name,
      priceRub: product.priceRub,
      quantity: quantity,
      unit: product.unit,
      image: product.imageUrl || undefined,
      step: step,
    });

    toast.success(`${product.name} добавлен в корзину`);
  };

  // 3. Красивое отображение (0.250 кг или 1 шт)
  const displayQuantity = product.unit === 'kg'
    ? `${quantity.toFixed(3)} кг`
    : `${quantity} шт`;

  // 4. Расчет цены (просто умножаем, т.к. quantity уже в правильных единицах)
  const displayPrice = (product.priceRub * quantity).toLocaleString('ru-RU');

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        {/* Кнопки +/- */}
        <div className="flex items-center rounded-md border bg-secondary/10">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDecrement}
            disabled={quantity <= step}
            className="h-10 w-10"
          >
            <Minus className="h-4 w-4" />
          </Button>

          <span className="w-24 text-center font-medium tabular-nums">
            {displayQuantity}
          </span>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleIncrement}
            className="h-10 w-10"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Цена за выбранный объем */}
        <div className="text-lg font-bold text-primary">
          {displayPrice} ₽
        </div>
      </div>

      {/* Кнопка купить */}
      <Button size="lg" className="w-full font-bold text-lg" onClick={handleAddToCart}>
        <ShoppingCart className="mr-2 h-5 w-5" />
        В корзину
      </Button>

      {/* Подсказка о цене за единицу */}
      <p className="text-xs text-center text-muted-foreground">
        Цена за {product.unit === 'kg' ? '1 кг' : '1 шт'}: {product.priceRub} ₽
      </p>
    </div>
  );
}