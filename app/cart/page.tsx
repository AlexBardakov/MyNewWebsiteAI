'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/store/cart';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2, ArrowRight, Clock, Moon } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { getStoreStatus } from '@/lib/time';
// Импортируем Alert компоненты
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function CartPage() {
  const { items, updateQuantity, removeItem, total } = useCart();

  // Состояния для работы со временем на клиенте
  const [storeStatus, setStoreStatus] = useState<'open' | 'closing_soon' | 'closed'>('open');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setStoreStatus(getStoreStatus());
    setMounted(true);
  }, []);

  // Функция для красивого отображения количества
  const formatQuantity = (val: number, unit: string) => {
    if (unit === 'pcs') return `${val} шт`;
    return `${Number(val.toFixed(3))} кг`;
  };

  // Округляем кол-во при изменении
  const handleUpdateQuantity = (id: string, newQty: number) => {
    updateQuantity(id, Number(newQty.toFixed(3)));
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 bg-secondary/30 rounded-full flex items-center justify-center mb-6">
          <span className="text-4xl">🛒</span>
        </div>
        <h1 className="text-2xl font-bold mb-2">Корзина пуста</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          Похоже, вы еще ничего не добавили.
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
                <h3 className="font-medium text-lg leading-tight">
                  {item.name}
                  {item.variant && (
                     <Badge variant="secondary" className="ml-2 text-xs font-normal text-muted-foreground px-1.5 py-0 h-5 align-middle">
                       {item.variant}
                     </Badge>
                  )}
                </h3>

                <p className="text-muted-foreground text-sm mt-1">
                  {item.unit === 'kg' ? 'Весовой товар' : 'Штучный товар'}
                </p>
                {/* Мобильная цена */}
                <div className="mt-1 font-bold text-primary md:hidden">
                    {formatPrice(item.priceRub * item.quantity)}
                </div>
              </div>

              {/* Управление кол-вом */}
              <div className="flex items-center gap-2 bg-secondary/20 rounded-lg p-1">
                <Button
                  variant="ghost" size="icon" className="h-8 w-8"
                  onClick={() => handleUpdateQuantity(item.id, Math.max(0, item.quantity - (item.step || 1)))}
                >
                  <Minus className="h-3 w-3" />
                </Button>

                <span className="min-w-[4.5rem] text-center text-sm font-medium tabular-nums">
                  {formatQuantity(item.quantity, item.unit)}
                </span>

                <Button
                  variant="ghost" size="icon" className="h-8 w-8"
                  onClick={() => handleUpdateQuantity(item.id, item.quantity + (item.step || 1))}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              {/* Десктоп цена */}
              <div className="hidden md:block text-right min-w-[120px]">
                <div className="font-bold text-lg">{formatPrice(item.priceRub * item.quantity)}</div>
                <div className="text-xs text-muted-foreground">
                  {item.priceRub} ₽ / {item.unit === 'kg' ? 'кг' : 'шт'}
                </div>
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

        {/* Итого и Оповещения */}
        <div className="lg:col-span-4">
          <div className="bg-card border border-secondary rounded-3xl p-6 sticky top-24 shadow-sm">
            <h2 className="text-xl font-bold mb-4">Ваш заказ</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-muted-foreground">
                <span>Товары ({items.length})</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between font-bold text-xl pt-4 border-t border-dashed border-secondary mb-4">
                <span>Итого</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            {/* БЛОК С ОПОВЕЩЕНИЯМИ ПЕРЕД КНОПКОЙ */}
            {mounted && storeStatus === 'closed' && (
              <Alert className="mb-4 bg-slate-100 border-slate-300">
                <Moon className="h-4 w-4" />
                <AlertTitle>Все сыровары спят (или работают в поте лица)</AlertTitle>
                <AlertDescription className="text-sm">
                  Ваш заказ будет бережно обработан в ближайший рабочий день. Вы можете указать удобный день доставки при оформлении заказа.
                </AlertDescription>
              </Alert>
            )}

            {mounted && storeStatus === 'closing_soon' && (
              <Alert className="mb-4 bg-orange-50 border-orange-200 text-orange-800">
                <Clock className="h-4 w-4 stroke-orange-600" />
                <AlertTitle>Скоро закрываемся!</AlertTitle>
                <AlertDescription className="text-sm">
                  Принимаем последние заказы. Мы постараемся связаться с Вами и обработать заказ сегодня, но доставка может быть перенесена на завтра.
                </AlertDescription>
              </Alert>
            )}

            <Button asChild size="lg" className="w-full font-bold text-lg h-12">
              <Link href="/checkout">
                Оформить заказ <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>

            <p className="text-xs text-center text-muted-foreground mt-4">
              Оплата производится после сбора и корректировки суммы заказа.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}