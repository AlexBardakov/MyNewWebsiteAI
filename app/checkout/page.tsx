'use client';

import { useCartStore } from "@/store/cart";
import { useActionState, useEffect, useState } from "react";
import { placeOrder } from "@/actions/place-order";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import { Trash2, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function CheckoutPage() {
  const { items, updateQuantity, removeItem, getTotalPrice, clearCart } = useCartStore();
  const [mounted, setMounted] = useState(false);
  
  // Hook для работы с Server Action
  // null - начальное состояние, placeOrder - функция
  const [state, formAction, isPending] = useActionState(placeOrder, null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Если сервер вернул ошибку, показываем тост
  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  if (!mounted) return null; // Ждем загрузки клиента

  if (items.length === 0) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Корзина пуста</h1>
        <p className="mb-8 text-muted-foreground">Добавьте вкусный сыр, чтобы сделать заказ.</p>
        <Link href="/">
          <Button>Перейти в каталог</Button>
        </Link>
      </div>
    );
  }

  const total = Math.round(getTotalPrice());

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-8">Оформление заказа</h1>

      <div className="grid lg:grid-cols-2 gap-10">
        
        {/* ЛЕВАЯ КОЛОНКА: Список товаров */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ваш заказ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 items-start border-b pb-4 last:border-0 last:pb-0">
                  {/* Название и цена */}
                  <div className="flex-1">
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatPrice(item.priceRub)} / {item.unit === 'kg' ? 'кг' : 'шт'}
                    </p>
                  </div>

                  {/* Управление количеством */}
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" size="icon" className="h-8 w-8"
                        onClick={() => updateQuantity(item.id, item.quantity - item.step)}
                        disabled={item.quantity <= item.step}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      
                      <span className="w-16 text-center text-sm font-medium">
                        {item.unit === 'kg' ? `${item.quantity} г` : `${item.quantity} шт`}
                      </span>

                      <Button 
                        variant="outline" size="icon" className="h-8 w-8"
                        onClick={() => updateQuantity(item.id, item.quantity + item.step)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive h-auto p-0 hover:bg-transparent"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Удалить
                    </Button>
                  </div>
                </div>
              ))}
              
              <div className="pt-4 flex justify-between items-center font-bold text-xl">
                <span>Итого:</span>
                <span>{formatPrice(total)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ПРАВАЯ КОЛОНКА: Форма данных */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Контактные данные</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={formAction} className="space-y-4">
                {/* Скрытые поля для передачи данных корзины на сервер */}
                <input type="hidden" name="cartItems" value={JSON.stringify(items)} />
                <input type="hidden" name="totalRub" value={total} />

                <div className="space-y-2">
                  <Label htmlFor="name">Ваше Имя</Label>
                  <Input id="name" name="name" placeholder="Иван Иванов" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Телефон</Label>
                  <Input id="phone" name="phone" type="tel" placeholder="+7 (999) 000-00-00" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Адрес доставки (оставьте пустым для самовывоза)</Label>
                  <Input id="address" name="address" placeholder="г. Москва, ул. Ленина..." />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="comment">Комментарий к заказу</Label>
                  <Textarea id="comment" name="comment" placeholder="Код домофона, пожелания по нарезке..." />
                </div>

                <Button type="submit" className="w-full mt-4" size="lg" disabled={isPending}>
                  {isPending ? 'Оформляем...' : 'Подтвердить заказ'}
                </Button>
                
                {state?.error && (
                  <p className="text-destructive text-sm text-center">{state.error}</p>
                )}
              </form>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}