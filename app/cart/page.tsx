'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/store/cart';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2, ArrowRight, Clock, Moon } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { getStoreStatus } from '@/lib/time';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getUnavailableProductIds } from '@/actions/cart-validation';

// Импорт компонентов диалога (поп-апа)
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem } = useCart();

  const [storeStatus, setStoreStatus] = useState<'open' | 'closing_soon' | 'closed'>('open');
  const [mounted, setMounted] = useState(false);
  const [unavailableIds, setUnavailableIds] = useState<string[]>([]);
  const [showTimeWarning, setShowTimeWarning] = useState(false);

  useEffect(() => {
    setStoreStatus(getStoreStatus());
    setMounted(true);
  }, []);

  // Проверка наличия товаров при загрузке или изменении корзины
  useEffect(() => {
    if (items.length === 0) return;

    const checkAvailability = async () => {
      // Собираем реальные ID товаров в базе
      const pIds = items.map(i => i.productId || i.id);
      const badProductIds = await getUnavailableProductIds(pIds);

      // Находим соответствующие ID в корзине
      const badCartItemIds = items
        .filter(i => badProductIds.includes(i.productId || i.id))
        .map(i => i.id);

      setUnavailableIds(badCartItemIds);
    };

    checkAvailability();
  }, [items]);

  // Вычисляем "эффективную" сумму, игнорируя недоступные товары
  const effectiveItems = useMemo(() => items.filter(i => !unavailableIds.includes(i.id)), [items, unavailableIds]);
  const effectiveTotal = useMemo(() => effectiveItems.reduce((sum, i) => sum + i.priceRub * i.quantity, 0), [effectiveItems]);

  const formatQuantity = (val: number, unit: string) => {
    if (unit === 'pcs') return `${val} шт`;
    return `${Number(val.toFixed(3))} кг`;
  };

  const handleUpdateQuantity = (id: string, newQty: number) => {
    updateQuantity(id, Number(newQty.toFixed(3)));
  };

  const handleCheckoutClick = (e: React.MouseEvent) => {
    if (storeStatus !== 'open') {
      e.preventDefault();
      setShowTimeWarning(true);
    } else {
      router.push('/checkout');
    }
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 bg-secondary/30 rounded-full flex items-center justify-center mb-6">
          <span className="text-4xl">🛒</span>
        </div>
        <h1 className="text-2xl font-bold mb-2">Корзина пуста</h1>
        <p className="text-muted-foreground mb-8 max-w-md">Похоже, вы еще ничего не добавили.</p>
        <div className="flex gap-4">
            <Button asChild variant="default" size="lg"><Link href="/catalog">В каталог</Link></Button>
            <Button asChild variant="outline" size="lg"><Link href="/cheese-plate">Собрать тарелку</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-8">Корзина</h1>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-4">
          {items.map((item) => {
            const isUnavailable = unavailableIds.includes(item.id);

            return (
              <div key={item.id} className={`flex gap-4 p-4 rounded-2xl border bg-card shadow-sm items-center transition-all ${isUnavailable ? 'border-destructive/30 bg-secondary/10 opacity-60 grayscale' : 'border-secondary'}`}>
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
                  <h3 className="font-medium text-lg leading-tight flex items-center flex-wrap gap-2">
                    <span className={isUnavailable ? 'line-through' : ''}>{item.name}</span>
                    {item.variant && (
                       <Badge variant="secondary" className="text-xs font-normal text-muted-foreground px-1.5 py-0 h-5">
                         {item.variant}
                       </Badge>
                    )}
                    {isUnavailable && (
                      <Badge variant="destructive" className="text-[10px] uppercase">Нет в наличии</Badge>
                    )}
                  </h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    {item.unit === 'kg' ? 'Весовой товар' : 'Штучный товар'}
                  </p>
                  <div className="mt-1 font-bold text-primary md:hidden">
                      {isUnavailable ? '--- ₽' : formatPrice(item.priceRub * item.quantity)}
                  </div>
                </div>

                {/* Управление кол-вом */}
                <div className={`flex items-center gap-2 rounded-lg p-1 ${isUnavailable ? 'pointer-events-none' : 'bg-secondary/20'}`}>
                  <Button
                    variant="ghost" size="icon" className="h-8 w-8" disabled={isUnavailable}
                    onClick={() => handleUpdateQuantity(item.id, Math.max(0, item.quantity - (item.step || 1)))}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="min-w-[4.5rem] text-center text-sm font-medium tabular-nums">
                    {formatQuantity(item.quantity, item.unit)}
                  </span>
                  <Button
                    variant="ghost" size="icon" className="h-8 w-8" disabled={isUnavailable}
                    onClick={() => handleUpdateQuantity(item.id, item.quantity + (item.step || 1))}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                {/* Десктоп цена */}
                <div className="hidden md:block text-right min-w-[120px]">
                  <div className={`font-bold text-lg ${isUnavailable ? 'line-through text-muted-foreground' : ''}`}>
                    {isUnavailable ? '--- ₽' : formatPrice(item.priceRub * item.quantity)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {item.priceRub} ₽ / {item.unit === 'kg' ? 'кг' : 'шт'}
                  </div>
                </div>

                {/* Кнопка удаления работает всегда */}
                <Button
                  variant="ghost" size="icon"
                  className="text-muted-foreground hover:text-destructive pointer-events-auto"
                  onClick={() => removeItem(item.id)}
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            );
          })}
        </div>

        {/* Итого и Оповещения */}
        <div className="lg:col-span-4">
          <div className="bg-card border border-secondary rounded-3xl p-6 sticky top-24 shadow-sm">
            <h2 className="text-xl font-bold mb-4">Ваш заказ</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-muted-foreground">
                <span>Товары ({effectiveItems.length})</span>
                <span>{formatPrice(effectiveTotal)}</span>
              </div>
              <div className="flex justify-between font-bold text-xl pt-4 border-t border-dashed border-secondary mb-4">
                <span>Итого</span>
                <span>{formatPrice(effectiveTotal)}</span>
              </div>
            </div>

            {/* Оповещения */}
            {mounted && storeStatus === 'closed' && (
              <Alert className="mb-4 bg-slate-100 border-slate-300">
                <Moon className="h-4 w-4" />
                <AlertTitle>Сейчас нерабочее время</AlertTitle>
                <AlertDescription className="text-sm">
                  Вы можете сделать заказ, но он будет обработан в ближайший рабочий день.
                </AlertDescription>
              </Alert>
            )}

            {mounted && storeStatus === 'closing_soon' && (
              <Alert className="mb-4 bg-orange-50 border-orange-200 text-orange-800">
                <Clock className="h-4 w-4 stroke-orange-600" />
                <AlertTitle>Близится конец рабочего дня!</AlertTitle>
                <AlertDescription className="text-sm">
                  Если у нас окажется высокая загруженность на производстве, доставка может быть перенесена на завтра. Мы согласуем с Вами вопрос доставки при переносе на следующий день.
                </AlertDescription>
              </Alert>
            )}

            <Button
              size="lg"
              className="w-full font-bold text-lg h-12"
              onClick={handleCheckoutClick}
              disabled={effectiveItems.length === 0}
            >
              Оформить заказ <ArrowRight className="ml-2 w-5 h-5" />
            </Button>

            {unavailableIds.length > 0 && (
              <p className="text-destructive text-xs text-center mt-3 font-medium">
                Часть товаров недоступна для заказа и исключена из суммы.
              </p>
            )}
            <p className="text-xs text-center text-muted-foreground mt-4">
              Оплата производится после сбора и корректировки суммы заказа.
            </p>
          </div>
        </div>
      </div>

      {/* ПОП-АП РАСПИСАНИЯ */}
      <Dialog open={showTimeWarning} onOpenChange={setShowTimeWarning}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Обратите внимание на время!</DialogTitle>
            <DialogDescription className="space-y-4 pt-3 text-base text-foreground">
              <p>
                В данный момент на сыроварне {storeStatus === 'closed' ? 'нерабочее время' : 'готовятся к закрытию'}, скорее всего мы  не сможем доставить ваш заказ сейчас.
              </p>
              <div className="bg-secondary/30 p-4 rounded-xl text-sm leading-relaxed">
                <strong>Наш график работы:</strong><br/>
                📍 Вт-Пт: с 10:00 до 21:00<br/>
                📍 Сб: с 12:00 до 20:00<br/>
                📍 Вс-Пн: выходной
              </div>
              <p className="text-muted-foreground text-sm">
                Вы можете оформить заказ прямо сейчас, и мы с любовью соберем его для вас в ближайший рабочий день!
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-4">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setShowTimeWarning(false)}>
              Отмена
            </Button>
            <Button className="w-full sm:w-auto font-medium" onClick={() => router.push('/checkout')}>
              Всё равно оформить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}