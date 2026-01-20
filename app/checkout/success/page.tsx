'use client';

import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart";
import { CheckCircle } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function SuccessPage() {
  const clearCart = useCartStore((state) => state.clearCart);

  // Очищаем корзину при входе на эту страницу
  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="container flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
      <div className="bg-green-100 p-6 rounded-full text-green-600">
        <CheckCircle className="w-16 h-16" />
      </div>
      <h1 className="text-3xl font-bold">Спасибо за заказ!</h1>
      <p className="text-muted-foreground max-w-md">
        Мы уже получили вашу заявку. Менеджер свяжется с вами по указанному телефону в ближайшее время для уточнения деталей.
      </p>
      <Link href="/">
        <Button size="lg">Вернуться в магазин</Button>
      </Link>
    </div>
  );
}