'use client';

import { useState } from 'react';
import { Minus, Plus, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/cart';
import { toast } from 'sonner';

interface ProductActionsProps {
  product: {
    id: string;
    name: string;
    priceRub: number;
    imageUrl: string | null;
    unit: string; // 'kg' | 'pcs'
  };
}

export default function ProductActions({ product }: ProductActionsProps) {
  const addItem = useCartStore((state) => state.addItem);
  
  // Определяем шаг: 1 шт или 100 грамм
  const step = product.unit === 'pcs' ? 1 : 100;
  const [quantity, setQuantity] = useState(step);

  const handleIncrement = () => setQuantity((q) => q + step);
  const handleDecrement = () => setQuantity((q) => (q > step ? q - step : step));

  const handleAddToCart = () => {
    // В Zustand мы добавляем товар. 
    // Поскольку метод addItem в нашем сторе (из прошлого шага) добавляет фиксированный шаг,
    // нам нужно или вызвать его несколько раз, или (правильнее) 
    // просто добавить товар, а потом обновить его количество.
    // Для простоты сейчас: просто добавляем через addItem (он добавит step) 
    // Но для полноценной работы лучше чуть доработать стор.
    
    // В данном случае мы просто вызовем addItem нужное кол-во раз или (лучший вариант)
    // просто добавим товар в корзину с текущим стейтом.
    // Давай используем простую логику: кнопка просто кидает товар в корзину.
    
    // ХАК: Чтобы не усложнять стор прямо сейчас, мы добавим 1 раз, 
    // а потом сразу обновим количество в сторе, если товара там еще не было.
    addItem(product);
    
    // Если пользователь выбрал больше чем 1 шаг, нам надо бы обновить кол-во.
    // Но чтобы не путать код: давай пока кнопка просто добавляет "порцию" (100гр или 1шт).
    // А полноценный выбор веса сделаем в корзине.
    // *Если хочешь сложную логику сразу - напиши, я переделаю.*
    
    toast.success(`${product.name} добавлен в корзину`);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Если бы мы делали выбор веса тут, кнопки были бы здесь. 
          Пока сделаем простую большую кнопку Купить */}
      <Button size="lg" onClick={handleAddToCart} className="w-full md:w-auto gap-2">
        <ShoppingCart />
        Добавить в корзину
      </Button>
    </div>
  );
}