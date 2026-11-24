'use server'

import { prisma } from "@/lib/prisma";

/**
 * Актуальное состояние товаров из корзины: что недоступно и какие сейчас цены.
 * Корзина хранится в браузере покупателя (localStorage) вместе с ценой на момент
 * добавления — после смены цены в админке там оставалась старая. Страницы корзины и
 * оформления зовут это при открытии и обновляют цены (store/cart.ts → syncPrices).
 */
export async function getCartState(productIds: string[]) {
  const ids = [...new Set((Array.isArray(productIds) ? productIds : []).map(String))].slice(0, 200);
  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
    select: { id: true, isActive: true, remainder: true, priceRub: true },
  });
  const found = new Set(products.map((p) => p.id));

  const unavailable = [
    // отключены или закончились
    ...products.filter((p) => !p.isActive || p.remainder <= 0).map((p) => p.id),
    // удалены из базы
    ...ids.filter((id) => !found.has(id)),
  ];
  const prices: Record<string, number> = Object.fromEntries(products.map((p) => [p.id, p.priceRub]));
  return { unavailable, prices };
}

/** Старый вызов (оставлен для совместимости): только недоступные товары. */
export async function getUnavailableProductIds(productIds: string[]) {
  return (await getCartState(productIds)).unavailable;
}
