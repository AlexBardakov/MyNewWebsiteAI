'use server';

// Если вдруг понадобится сохранять в БД, раскомментируй импорт:
// import { prisma } from '@/lib/prisma';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  priceRub: number;
  unit: string;
}

interface CustomerData {
  name: string;
  phone: string;
  address: string;     // Адрес или "Самовывоз"
  comment?: string;
  deliveryType: 'delivery' | 'pickup';
}

interface OrderPayload {
  items: OrderItem[];
  customer: CustomerData;
  total: number;
}

export async function placeOrder(data: OrderPayload) {
  try {
    // 1. Проверка данных
    if (!data.items || data.items.length === 0) {
      return { success: false, error: 'Корзина пуста' };
    }
    if (!data.customer.name || !data.customer.phone) {
      return { success: false, error: 'Не заполнены обязательные поля' };
    }

    // 2. Формируем сообщение для Telegram
    const emoji = data.customer.deliveryType === 'delivery' ? '🚚 Доставка' : '🏪 Самовывоз';
    const date = new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Krasnoyarsk' }); // Или твой часовой пояс

    let message = `<b>Новый заказ!</b>\n`;
    message += `📅 ${date}\n`;
    message += `----------------\n`;
    message += `👤 <b>${data.customer.name}</b>\n`;
    message += `📞 <a href="tel:${data.customer.phone}">${data.customer.phone}</a>\n`;
    message += `Тип: <b>${emoji}</b>\n`;

    if (data.customer.deliveryType === 'delivery') {
        message += `📍 Адрес: ${data.customer.address}\n`;
    }

    if (data.customer.comment) {
        message += `💬 Комментарий: "${data.customer.comment}"\n`;
    }

    message += `----------------\n`;
    message += `<b>Состав заказа:</b>\n`;

    data.items.forEach((item, index) => {
      // Форматируем кол-во: если кг, то с долями, если шт, то целое
      const qtyStr = item.unit === 'kg'
        ? `${item.quantity.toFixed(2)} кг`
        : `${item.quantity} шт`;

      const sum = Math.round(item.priceRub * item.quantity).toLocaleString('ru-RU');

      message += `${index + 1}. ${item.name}\n`;
      message += `   └ ${qtyStr} x ${item.priceRub} ₽ = ${sum} ₽\n`;
    });

    message += `----------------\n`;
    message += `💰 <b>ИТОГО: ${Math.round(data.total).toLocaleString('ru-RU')} ₽</b>`;

    // 3. Отправляем в Telegram
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

    if (!token || !chatId) {
      console.error('Telegram keys are missing in .env');
      // Возвращаем ошибку клиенту, чтобы он знал, что заказ не ушел
      return { success: false, error: 'Ошибка сервера: не настроены уведомления.' };
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Telegram API error:', errText);
      return { success: false, error: 'Не удалось отправить заказ. Попробуйте связаться по телефону.' };
    }

    // 4. (Опционально) Сохранение в БД
    // Если решишь сохранять заказы для истории, добавь код prisma.order.create здесь.
    // Пока что возвращаем успех, так как платежи и ЛК не нужны.

    return { success: true };

  } catch (error) {
    console.error('Place order exception:', error);
    return { success: false, error: 'Произошла непредвиденная ошибка.' };
  }
}