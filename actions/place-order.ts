// actions/place-order.ts
'use server'

import { prisma } from "@/lib/prisma";
import { sendTelegramNotification } from "@/lib/telegram";
import { revalidatePath } from "next/cache";

interface CartItem {
  id: string;
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
}

export async function placeOrder(data: OrderData) {
  try {
    // Подготовка товаров для БД (конвертация кг -> граммы)
    const dbItems = data.items.map((item) => {
      const isKg = item.unit === 'kg';
      // Если кг, умножаем на 1000 (0.5 кг -> 500 г). Если шт, оставляем как есть.
      const quantityForDb = isKg ? Math.round(item.quantity * 1000) : item.quantity;

      return {
        productId: item.id,
        productName: item.name,
        unit: item.unit,
        quantity: quantityForDb, // В базу пишем Int (граммы или штуки)
        priceRub: Math.round(item.priceRub),
        lineTotalRub: Math.round(item.priceRub * item.quantity),
      };
    });

    // 1. Сохраняем заказ в БД
    const order = await prisma.order.create({
      data: {
        status: 'new',
        totalRub: Math.round(data.total),
        customerName: data.customer.name,
        customerPhone: data.customer.phone,
        customerAddress: data.customer.address,
        customerComment: data.customer.comment,
        deliveryMethod: data.customer.deliveryType,
        items: {
          create: dbItems
        }
      },
      include: { items: true }
    });

    // 2. Отправляем уведомление в Telegram
    try {
        await sendTelegramNotification({
            id: order.id.slice(-6).toUpperCase(),
            customerName: order.customerName,
            phone: order.customerPhone,
            deliveryMethod: order.deliveryMethod,
            address: order.customerAddress,
            comment: order.customerComment,
            totalAmount: order.totalRub,
            items: data.items.map(item => ({
                name: item.name,
                // Передаем в телеграм исходное количество (0.3 кг), а не граммы (300)
                quantity: item.quantity,
                price: item.priceRub,
                unit: item.unit // ИСПРАВЛЕНИЕ: Обязательно передаем единицу измерения
            }))
        });
    } catch (tgError) {
        console.error("Ошибка отправки в Telegram:", tgError);
    }

    revalidatePath('/admin/orders');
    return { success: true, orderId: order.id };

  } catch (error) {
    console.error("Ошибка создания заказа:", error);
    return { success: false, error: 'Не удалось создать заказ. Попробуйте позвонить нам.' };
  }
}