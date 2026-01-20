"use server";

import { db } from "@/lib/db"; // Ваш путь к клиенту Prisma
import { sendTelegramNotification } from "@/lib/telegram";
import { z } from "zod";

// Пример схемы валидации (замените на вашу)
const orderSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10),
  deliveryMethod: z.enum(["pickup", "delivery"]),
  address: z.string().optional(),
  comment: z.string().optional(),
  // ... остальные поля
});

export async function createOrder(formData: z.infer<typeof orderSchema>, cartItems: any[]) {
  try {
    // 1. Создаем заказ в базе данных
    // ВАЖНО: Используйте include: { items: true }, чтобы сразу получить созданные товары
    const newOrder = await db.order.create({
      data: {
        customerName: formData.name,
        phone: formData.phone,
        deliveryMethod: formData.deliveryMethod,
        address: formData.address,
        comment: formData.comment,
        totalAmount: 1000, // Тут должна быть ваша логика подсчета суммы
        
        // Создаем связанные товары
        items: {
          create: cartItems.map((item) => ({
            productId: item.id,
            name: item.name,      // Сохраняем имя на момент покупки
            price: item.price,    // Сохраняем цену на момент покупки
            quantity: item.quantity,
          })),
        },
      },
      include: {
        items: true, // ОБЯЗАТЕЛЬНО: возвращаем товары, чтобы отправить их в телеграм
      },
    });

    // 2. Отправляем уведомление в Telegram
    // Делаем это без await, чтобы клиент не ждал отправки сообщения
    // (или с await, если хотите гарантировать отправку перед редиректом)
    await sendTelegramNotification({
      id: newOrder.id,
      customerName: newOrder.customerName,
      phone: newOrder.phone,
      deliveryMethod: newOrder.deliveryMethod,
      address: newOrder.address,
      comment: newOrder.comment,
      totalAmount: newOrder.totalAmount, // Убедитесь, что это число (Number)
      items: newOrder.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
    });

    return { success: true, orderId: newOrder.id };

  } catch (error) {
    console.error("Ошибка при создании заказа:", error);
    return { success: false, error: "Не удалось создать заказ" };
  }
}