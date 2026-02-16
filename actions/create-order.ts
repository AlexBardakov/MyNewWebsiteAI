"use server";

import { db } from "@/lib/db";
import { sendTelegramNotification } from "@/lib/telegram";
import { z } from "zod";

// Схема валидации данных формы
const orderSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10),
  deliveryMethod: z.enum(["pickup", "delivery"]),
  address: z.string().optional(),
  comment: z.string().optional(),
  totalAmount: z.number().optional(),
});

export async function createOrder(formData: z.infer<typeof orderSchema>, cartItems: any[]) {
  try {
    // Рассчитываем итоговую сумму (или берем из формы)
    const calculatedTotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const finalTotal = formData.totalAmount || calculatedTotal;

    // 1. Создаем заказ в БД
    const newOrder = await db.order.create({
      data: {
        customerName: formData.name,
        customerPhone: formData.phone,
        deliveryMethod: formData.deliveryMethod,
        customerAddress: formData.address,
        customerComment: formData.comment,
        totalRub: finalTotal,
        deliveryRub: 0,
        
        // Создаем связанные товары
        items: {
          create: cartItems.map((item) => ({
            productId: item.id,
            productName: item.name,
            priceRub: item.price,
            quantity: item.quantity,
            unit: item.unit || 'шт',         // Сохраняем unit в БД
            lineTotalRub: item.price * item.quantity,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // 2. Отправляем уведомление в Telegram
    await sendTelegramNotification({
      id: newOrder.id,
      customerName: newOrder.customerName,
      phone: newOrder.customerPhone,
      deliveryMethod: newOrder.deliveryMethod,
      address: newOrder.customerAddress || '',
      comment: newOrder.customerComment || '',
      totalAmount: newOrder.totalRub,
      items: newOrder.items.map((item) => ({
        name: item.productName,
        quantity: item.quantity,
        price: item.priceRub,
        unit: item.unit,  // <--- ДОБАВИЛИ ЭТУ СТРОКУ (исправление ошибки)
      })),
    });

    return { success: true, orderId: newOrder.id };

  } catch (error) {
    console.error("Ошибка при создании заказа:", error);
    return { success: false, error: "Не удалось создать заказ" };
  }
}