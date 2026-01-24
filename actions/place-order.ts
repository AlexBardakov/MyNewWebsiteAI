'use server'

import { prisma } from "@/lib/prisma";
import { sendTelegramNotification } from "@/lib/telegram";
import { revalidatePath } from "next/cache";

// Типы данных, приходящих с фронтенда
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
    // 1. Сохраняем заказ в Базу Данных
    // Используем точные названия полей из schema.prisma
    const order = await prisma.order.create({
      data: {
        status: 'new',

        // В схеме поле называется totalRub (Int)
        totalRub: Math.round(data.total),

        // Поля total в схеме НЕТ, удаляем его, чтобы не было ошибки

        customerName: data.customer.name,
        customerPhone: data.customer.phone,
        customerAddress: data.customer.address,

        // В схеме поле называется customerComment
        customerComment: data.customer.comment,

        // В схеме поле называется deliveryMethod
        deliveryMethod: data.customer.deliveryType,

        items: {
          create: data.items.map((item) => ({
             // Связь с продуктом обязательна по схеме
             productId: item.id,

             // Маппинг полей OrderItem согласно schema.prisma:
             productName: item.name,      // было name
             unit: item.unit,             // обязательное поле
             quantity: item.quantity,
             priceRub: Math.round(item.priceRub), // было price
             lineTotalRub: Math.round(item.priceRub * item.quantity), // было total
          }))
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
            deliveryMethod: order.deliveryMethod, // Используем значение из созданного заказа
            address: order.customerAddress,
            comment: order.customerComment,
            totalAmount: order.totalRub,
            items: order.items.map(item => ({
                name: item.productName,
                quantity: item.quantity,
                price: item.priceRub
            }))
        });
    } catch (tgError) {
        console.error("Ошибка отправки в Telegram:", tgError);
    }

    // 3. Обновляем страницу заказов в админке
    revalidatePath('/admin/orders');

    return { success: true, orderId: order.id };

  } catch (error) {
    console.error("Ошибка создания заказа:", error);
    return { success: false, error: 'Не удалось создать заказ. Попробуйте позвонить нам.' };
  }
}