"use client";

import { useCart } from "@/store/cart";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function CartPage() {
  const { items, updateQuantity, removeItem, totalPrice } = useCart();
  const [mounted, setMounted] = useState(false);

  // Избегаем гидратации
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Корзина пуста</h1>
        <p className="text-gray-600 mb-8">Добавьте вкусный сыр, чтобы продолжить.</p>
        <Link href="/catalog">
          <Button>Перейти в каталог</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Корзина</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4 items-center bg-white p-4 rounded-lg shadow-sm border">
              {/* Картинка */}
              <div className="relative h-20 w-20 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                {item.image ? (
                  <Image src={item.image} alt={item.name} fill className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400 text-xs">Нет фото</div>
                )}
              </div>

              {/* Инфо */}
              <div className="flex-1">
                <h3 className="font-medium">{item.name}</h3>
                <p className="text-sm text-gray-500">
                    {item.priceRub} ₽ / {item.unit === 'kg' ? 'кг' : 'шт'}
                </p>
                {item.unit === 'kg' && (
                    <p className="text-xs text-blue-600 mt-1">
                        Шаг веса: {item.step} г
                    </p>
                )}
              </div>

              {/* Управление */}
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center border rounded-md">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                        const newQty = item.quantity - item.step;
                        if (newQty >= item.step) updateQuantity(item.id, newQty);
                    }}
                    disabled={item.quantity <= item.step}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-16 text-center text-sm font-medium">
                    {item.unit === 'kg' ? `${item.quantity} г` : item.quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateQuantity(item.id, item.quantity + item.step)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                <div className="flex items-center gap-4">
                    <span className="font-bold">
                        {item.unit === 'kg'
                           ? Math.round((item.priceRub * item.quantity) / 1000)
                           : item.price * item.quantity} ₽
                    </span>
                    <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-400 hover:text-red-600"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Итого */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-sm border sticky top-4">
            <h2 className="text-xl font-bold mb-4">Итого</h2>
            <div className="flex justify-between mb-2 text-lg">
                <span>Сумма заказа:</span>
                <span className="font-bold">{Math.round(totalPrice())} ₽</span>
            </div>
            <p className="text-sm text-gray-500 mb-6">Доставка рассчитывается при оформлении.</p>

            <Link href="/checkout" className="w-full">
                <Button size="lg" className="w-full">
                    Оформить заказ <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}