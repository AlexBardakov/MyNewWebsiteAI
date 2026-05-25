// actions/place-order.ts
'use server'

import { prisma } from "@/lib/prisma";
import { sendTelegramNotification } from "@/lib/telegram";
import { revalidatePath } from "next/cache";

interface CartItem {
  id: string;
  productId?: string;
  variant?: string;
  name: string;
  priceRub: number;
  quantity: number;
  unit: string;
}

interface OrderData {
  items: CartItem[];
  total: number;
  customer: {
    name: string;
    phone: string;
    deliveryType: 'delivery' | 'pickup';
    address: string;
    comment: string;
  };
  /**
   * Подтверждения согласий (152-ФЗ). Без обоих true заказ не оформляется.
   * Проверяется на сервере, дублирует клиентскую валидацию из app/checkout/page.tsx.
   */
  consent: {
    pdn: boolean;
    oferta: boolean;
  };
}

export async function placeOrder(data: OrderData) {
  try {
    // СЕРВЕРНАЯ ВАЛИДАЦИЯ СОГЛАСИЙ.
    // Это критический rate-limit: если злоумышленник обойдёт клиентскую проверку
    // через DevTools, сервер всё равно откажет.
    if (!data.consent?.pdn || !data.consent?.oferta) {
      return {
        success: false,
        error: 'Для оформления заказа необходимо подтвердить согласие на обработку персональных данных и принятие Публичной оферты.',
      };
    }

    // Подготовка товаров для БД (конвертация кг -> граммы)
    const dbItems = data.items.map((item) => {
      const isKg = item.unit === 'kg';
      // Если кг, умножаем на 1000 (0.5 кг -> 500 г). Если шт, оставляем как есть.
      const quantityForDb = isKg ? Math.round(item.quantity * 1000) : item.quantity;

      return {
        // ВАЖНО: Если передан productId (для вариативных товаров), используем его.
        // Если нет (старые товары), используем id из корзины.
        productId: item.productId || item.id,
        productName: item.name,
        // Сохраняем вариант, если он есть
        variant: item.variant || null,

        unit: item.unit,
        quantity: quantityForDb, // В базу пишем Int (граммы или штуки)
        priceRub: Math.round(item.priceRub),
        lineTotalRub: Math.round(item.priceRub * item.quantity),
      };
    });

    // 1. Сохраняем заказ в БД.
    //    consentAcceptedAt фиксирует момент подтверждения согласия (152-ФЗ ст. 9 ч. 4).
    //    Запись делается только если серверная валидация согласий прошла (см. выше),
    //    поэтому здесь безопасно проставлять текущий timestamp.
    const order = await prisma.order.create({
      data: {
        status: 'new',
        totalRub: Math.round(data.total),
        customerName: data.customer.name,
        customerPhone: data.customer.phone,
        customerAddress: data.customer.address,
        customerComment: data.customer.comment,
        deliveryMethod: data.customer.deliveryType,
        consentAcceptedAt: new Date(),
        items: {
          create: dbItems
        }
      },
      include: { items: true }
    });

    // 2. Отправляем ОБЕЗЛИЧЕННОЕ уведомление в Telegram В ФОНЕ (без await).
    //    Никаких ПДн (имя, телефон, адрес, комментарий) в Telegram не уходит.
    //    Подробности см. lib/telegram.ts и docs/privacy-draft.md, раздел 7.3.
    sendTelegramNotification({
        shortId: order.id.slice(-6).toUpperCase(),
        dbId: order.id,
        deliveryMethod: order.deliveryMethod,
        totalAmount: order.totalRub,
        items: data.items.map(item => ({
            name: item.name,
            variant: item.variant ?? null,
            quantity: item.quantity,
            price: item.priceRub,
            unit: item.unit,
        })),
    }).catch(tgError => console.error("Ошибка фоновой отправки в Telegram:", tgError));

    revalidatePath('/admin/orders');

    // Мгновенно возвращаем успех на фронтенд, не дожидаясь ответа от Telegram
    return { success: true, orderId: order.id };

  } catch (error) {
    console.error("Ошибка создания заказа:", error);
    return { success: false, error: 'Не удалось создать заказ. Попробуйте позвонить нам.' };
  }
}