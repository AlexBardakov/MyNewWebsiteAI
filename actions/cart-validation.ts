'use server'

import { prisma } from "@/lib/prisma";

export async function getUnavailableProductIds(productIds: string[]) {
  // Ищем все переданные товары в базе
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, isActive: true, remainder: true }
  });

  const dbIds = products.map(p => p.id);

  // Товары, которые отключены или закончились (остаток <= 0)
  const unavailable = products
    .filter(p => !p.isActive || p.remainder <= 0)
    .map(p => p.id);

  // Товары, которых вообще нет в БД (возможно, были удалены)
  const missing = productIds.filter(id => !dbIds.includes(id));

  // Возвращаем уникальный массив ID недоступных товаров (Product ID)
  return Array.from(new Set([...unavailable, ...missing]));
}