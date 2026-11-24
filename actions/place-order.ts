// actions/place-order.ts
'use server'

import { prisma } from "@/lib/prisma";
import { notifyNewOrder } from "@/lib/notify";
import { normalizePhone } from "@/lib/phone";
import { revalidatePath } from "next/cache";

/** Позиция корзины, как её прислал браузер. Доверяем только productId, варианту и количеству. */
interface CartItem {
  id: string;
  productId?: string;
  variant?: string;
  name: string;
  priceRub: number;   // цена, которую видел покупатель — только для сверки с базой
  quantity: number;   // кг (для весовых) или штуки
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

export type PlaceOrderResult =
  | { success: true; orderId: string }
  | {
      success: false;
      error: string;
      /** PRICES_CHANGED — цены в корзине устарели (prices — актуальные);
       *  UNAVAILABLE — часть товаров закончилась/скрыта/удалена (unavailable — их productId). */
      code?: 'PRICES_CHANGED' | 'UNAVAILABLE' | 'INVALID';
      prices?: Record<string, number>;
      unavailable?: string[];
    };

const fail = (error: string, extra: Omit<Extract<PlaceOrderResult, { success: false }>, 'success' | 'error'> = {}): PlaceOrderResult =>
  ({ success: false, error, ...extra });

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/**
 * Оформление заказа.
 *
 * Сервер НЕ доверяет ценам и сумме из браузера: состав, единицы, цены и итог берутся
 * из базы. Цена из корзины используется только для сверки — если она устарела (цену
 * поменяли в админке), заказ не создаётся, а браузер получает актуальные цены и
 * показывает их покупателю перед повторным подтверждением.
 */
export async function placeOrder(data: OrderData): Promise<PlaceOrderResult> {
  try {
    // СЕРВЕРНАЯ ВАЛИДАЦИЯ СОГЛАСИЙ (дублирует клиентскую — её можно обойти через DevTools).
    if (!data?.consent?.pdn || !data?.consent?.oferta) {
      return fail('Для оформления заказа необходимо подтвердить согласие на обработку персональных данных и принятие Публичной оферты.');
    }

    // ---- Покупатель ----
    const name = str(data.customer?.name, 100);
    const phone = str(data.customer?.phone, 40);
    const deliveryType = data.customer?.deliveryType === 'delivery' ? 'delivery' : data.customer?.deliveryType === 'pickup' ? 'pickup' : null;
    const address = str(data.customer?.address, 300);
    const comment = str(data.customer?.comment, 1000);

    if (!name) return fail('Укажите имя', { code: 'INVALID' });
    if (!normalizePhone(phone).valid) return fail('Проверьте номер телефона', { code: 'INVALID' });
    if (!deliveryType) return fail('Выберите способ получения', { code: 'INVALID' });
    if (deliveryType === 'delivery' && (!address || address === 'Самовывоз')) {
      return fail('Укажите адрес доставки', { code: 'INVALID' });
    }

    // ---- Состав ----
    const items = Array.isArray(data.items) ? data.items : [];
    if (items.length === 0) return fail('Корзина пуста', { code: 'INVALID' });
    if (items.length > 100) return fail('Слишком много позиций в заказе', { code: 'INVALID' });

    const ids = [...new Set(items.map((i) => String(i.productId || i.id || '').split('::')[0]).filter(Boolean))];
    const products = await prisma.product.findMany({
      where: { id: { in: ids } },
      include: { variants: { select: { name: true } } },
    });
    const byId = new Map(products.map((p) => [p.id, p]));

    // Товары, которых нет, которые скрыты или закончились.
    const unavailable = ids.filter((id) => {
      const p = byId.get(id);
      return !p || !p.isActive || p.remainder <= 0;
    });
    if (unavailable.length > 0) {
      return fail('Некоторые товары закончились. Мы обновили корзину — проверьте её и подтвердите заказ ещё раз.', {
        code: 'UNAVAILABLE',
        unavailable,
      });
    }

    const prices = Object.fromEntries(products.map((p) => [p.id, p.priceRub]));
    let pricesChanged = false;

    const dbItems = [];
    for (const item of items) {
      const productId = String(item.productId || item.id).split('::')[0];
      const p = byId.get(productId)!;
      const q = Number(item.quantity);

      // Количество: для весовых — в кг (храним в граммах), для штучных — целое.
      let quantity: number;
      if (p.unit === 'kg') {
        quantity = Math.round(q * 1000);
        if (!Number.isFinite(q) || quantity < 1 || quantity > 50_000) return fail(`Проверьте количество: «${p.name}»`, { code: 'INVALID' });
      } else {
        if (!Number.isInteger(q) || q < 1 || q > 100) return fail(`Проверьте количество: «${p.name}»`, { code: 'INVALID' });
        quantity = q;
      }

      // Вариант (например, вкус) — только из списка вариантов этого товара.
      const variant = typeof item.variant === 'string' && item.variant ? item.variant.slice(0, 100) : null;
      if (variant && !p.variants.some((v) => v.name === variant)) {
        return fail(`Вариант «${variant}» больше недоступен для «${p.name}». Обновите корзину.`, { code: 'UNAVAILABLE', unavailable: [productId] });
      }

      if (Math.round(Number(item.priceRub)) !== p.priceRub) pricesChanged = true;

      const kgOrPcs = p.unit === 'kg' ? quantity / 1000 : quantity;
      dbItems.push({
        productId,
        productName: p.name,
        variant,
        unit: p.unit,
        quantity,
        priceRub: p.priceRub,
        lineTotalRub: Math.round(p.priceRub * kgOrPcs),
      });
    }

    if (pricesChanged) {
      return fail('Цены на некоторые товары изменились. Мы обновили корзину — проверьте сумму и подтвердите заказ ещё раз.', {
        code: 'PRICES_CHANGED',
        prices,
      });
    }

    const totalRub = dbItems.reduce((s, i) => s + i.lineTotalRub, 0);

    // 1. Сохраняем заказ. consentAcceptedAt — момент подтверждения согласия (152-ФЗ ст. 9 ч. 4).
    const order = await prisma.order.create({
      data: {
        status: 'new',
        totalRub,
        customerName: name,
        customerPhone: phone,
        customerAddress: deliveryType === 'delivery' ? address : 'Самовывоз',
        customerComment: comment || null,
        deliveryMethod: deliveryType,
        consentAcceptedAt: new Date(),
        items: { create: dbItems },
      },
      include: { items: true },
    });

    // 2. ОБЕЗЛИЧЕННОЕ уведомление администраторам (ВКонтакте + журнал для приложения) В ФОНЕ.
    //    Подробности: lib/notify/index.ts.
    notifyNewOrder(order).catch((e) => console.error("Ошибка фоновой отправки уведомления о заказе:", e));

    revalidatePath('/admin/orders');

    // Мгновенно возвращаем успех, не дожидаясь отправки уведомления
    return { success: true, orderId: order.id };

  } catch (error) {
    console.error("Ошибка создания заказа:", error);
    return fail('Не удалось создать заказ. Попробуйте позвонить нам.');
  }
}
