'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/store/cart';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2, ArrowRight } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';

export default function CartPage() {
  const { items, updateQuantity, removeItem, total } = useCart();

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 bg-secondary/30 rounded-full flex items-center justify-center mb-6">
          <span className="text-4xl">🛒</span>
        </div>
        <h1 className="text-2xl font-bold mb-2">Корзина пуста</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          Похоже, вы еще ничего не добавили. Загляните в каталог или соберите сырную тарелку!
        </p>
        <div className="flex gap-4">
            <Button asChild variant="default" size="lg">
              <Link href="/catalog">В каталог</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/cheese-plate">Собрать тарелку</Link>
            </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-8">Корзина</h1>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Список товаров */}
        <div className="lg:col-span-8 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4 p-4 rounded-2xl border border-secondary bg-card shadow-sm items-center">
              {/* Картинка */}
              <div className="relative w-20 h-20 bg-secondary/20 rounded-lg overflow-hidden flex-shrink-0">
                {item.image ? (
                  <Image src={item.image} alt={item.name} fill className="object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-xs text-muted-foreground">Нет фото</div>
                )}
              </div>

              {/* Инфо */}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-lg leading-tight truncate">{item.name}</h3>
                <p className="text-muted-foreground text-sm">
                  {item.unit === 'kg' ? 'Весовой товар' : 'Штучный товар'}
                </p>
                <div className="mt-1 font-bold text-primary md:hidden">
                    {formatPrice(item.priceRub * item.quantity)} ₽
                </div>
              </div>

              {/* Управление кол-вом (скрыто на совсем мелких, показано на md) */}
              <div className="flex items-center gap-3 bg-secondary/20 rounded-lg p-1">
                <Button 
                  variant="ghost" size="icon" className="h-8 w-8"
                  onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - (item.step || 1)))}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-12 text-center text-sm font-medium">
                  {item.unit === 'kg' ? item.quantity.toFixed(1) : item.quantity} {item.unit === 'kg' ? 'кг' : 'шт'}
                </span>
                <Button 
                  variant="ghost" size="icon" className="h-8 w-8"
                  onClick={() => updateQuantity(item.id, item.quantity + (item.step || 1))}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              {/* Цена и удаление */}
              <div className="hidden md:block text-right min-w-[100px]">
                <div className="font-bold text-lg">{formatPrice(item.priceRub * item.quantity)} ₽</div>
                <div className="text-xs text-muted-foreground">{formatPrice(item.priceRub)} ₽ / {item.unit === 'kg' ? 'кг' : 'шт'}</div>
              </div>

              <Button 
                variant="ghost" size="icon" 
                className="text-muted-foreground hover:text-destructive"
                onClick={() => removeItem(item.id)}
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          ))}
        </div>

        {/* Итого */}
        <div className="lg:col-span-4">
          <div className="bg-card border border-secondary rounded-3xl p-6 sticky top-24 shadow-sm">
            <h2 className="text-xl font-bold mb-4">Ваш заказ</h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-muted-foreground">
                <span>Товары ({items.length})</span>
                <span>{formatPrice(total)} ₽</span>
              </div>
              <div className="flex justify-between font-bold text-xl pt-4 border-t border-dashed border-secondary">