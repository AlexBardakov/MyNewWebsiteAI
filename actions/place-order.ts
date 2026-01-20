'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { sendTelegramNotification } from '@/lib/telegram';
import { redirect } from 'next/navigation';

// Схема валидации данных формы
const OrderSchema = z.object({
  name: z.string().min(2, "Имя обязательно"),
  phone: z.string().min(10, "Введите корректный телефон"),
  address: z.string().optional(),
  comment: z.string().optional(),
  // Важный момент: товары приходят с клиента как JSON
  items: z.array(z.object({
    id: z.string(),
    quantity: z.number(),
    priceRub: z.number(),
    name: z.string(),
    unit: z.string(),
  })).min(1, "Корзина пуста"),
  totalRub: z.number(),
});

export async function placeOrder(prevState: any, formData: FormData) {
  // 1. Извлекаем JSON с товарами, который мы положим в скрытый инпут формы
  const cartItemsRaw = formData.get('cartItems') as string;
  const cartItems = cartItemsRaw ? JSON.parse(cartItemsRaw) : [];

  // 2. Собираем объект заказа
  const rawData = {
    name: formData.get('name'),
    phone: formData.get('phone'),
    address: formData.get('address'),
    comment: formData.get('comment'),
    items: cartItems,
    totalRub: Number(formData.get('totalRub')),
  };

  // 3. Валидация
  const validated = OrderSchema.safeParse(rawData);

  if (!validated.success) {
    return {
      error: validated.error.errors[0].message,
    };
  }

  const data = validated.data;

  try {
    // 4. Создаем заказ в БД
    const order = await prisma.order.create({
      data: {
        customerName: data.name,
        customerPhone: data.phone,
        customerAddress: data.address || '',
        customerComment: data.comment || '',
        status: 'new',
        deliveryMethod: data.address ? 'delivery' : 'pickup',
        totalRub: data.totalRub,
        items: {
          create: data.items.map((item) => ({
            productId: item.id,
            productName: item.name,
            unit: item.unit,
            priceRub: item.priceRub,
            quantity: item.quantity,
            lineTotalRub: item.unit === 'kg' 
              ? Math.round((item.priceRub * item.quantity) / 1000)
              : item.priceRub * item.quantity,
          })),
        },
      },
      include: { items: true } // чтобы получить данные для уведомления
    });

    // 5. Отправляем уведомление в Telegram (не блокируем ответ)
    const text = `🧀 <b>Новый заказ #${order.id.slice(-4)}</b>\n` +
      `👤 ${data.name}\n📞 ${data.phone}\n📍 ${data.address || 'Самовывоз'}\n` +
      `💰 <b>${data.totalRub} ₽</b>\n\n` +
      data.items.map(i => `- ${i.name}: ${i.quantity} ${i.unit === 'kg' ? 'г' : 'шт'}`).join('\n') +
      (data.comment ? `\n\n💬 Комментарий: ${data.comment}` : '');

    await sendTelegramNotification({
  id: order.id,
  customerName: order.customerName,
  phone: order.customerPhone,      // Ваши поля из базы
  deliveryMethod: order.deliveryMethod,
  address: order.customerAddress,
  comment: order.customerComment,
  totalAmount: order.totalRub,     // Ваше поле из базы
  items: order.items.map((item) => ({
    name: item.productName,
    quantity: item.quantity,
    price: item.priceRub,
  })),
});

  } catch (e) {
    console.error(e);
    return { error: 'Ошибка при создании заказа' };
  }

  // 6. Редирект на страницу успеха
  redirect('/checkout/success');
}