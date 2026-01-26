// lib/telegram.ts

export interface TelegramOrderData {
  id: number | string;
  customerName: string;
  phone: string;
  deliveryMethod: "delivery" | "pickup" | string;
  address?: string | null;
  comment?: string | null;
  totalAmount: number;
  items: {
    name: string;
    quantity: number;
    price: number;
    unit: string; // Добавили поле unit
  }[];
}

export async function sendTelegramNotification(order: TelegramOrderData) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

  if (!token || !chatId) {
    console.error("❌ Ошибка: Не заданы переменные окружения для Telegram.");
    return;
  }

  // 1. Формируем список товаров
  const itemsList = order.items
    .map((item, index) => {
      const lineTotal = Math.round(item.price * item.quantity);

      // Логика форматирования количества
      let qtyString = "";
      if (item.unit === 'kg') {
        // Если это кг, показываем 3 знака (например, 0.500 кг)
        qtyString = `${item.quantity.toFixed(3)} кг`;
      } else {
        // Если штуки, просто число
        qtyString = `${item.quantity} шт.`;
      }

      return `${index + 1}. <b>${item.name}</b>\n   └ ${qtyString} x ${item.price} ₽ = ${lineTotal} ₽`;
    })
    .join("\n");

  // 2. Блок доставки
  const isDelivery = order.deliveryMethod === "delivery";

  const deliveryInfo = isDelivery
    ? `🚚 <b>Доставка по адресу:</b>\n${order.address || "Адрес не указан"}`
    : `🏃 <b>Самовывоз</b>`;

  // 3. Собираем сообщение
  const message = `
📦 <b>НОВЫЙ ЗАКАЗ #${order.id}</b>

👤 <b>Клиент:</b> ${order.customerName}
📞 <b>Телефон:</b> ${order.phone}
${order.comment ? `💬 <b>Комментарий:</b> ${order.comment}\n` : ""}
━━━━━━━━━━━━━━━━
<b>Состав заказа:</b>
${itemsList}
━━━━━━━━━━━━━━━━
💰 <b>ИТОГО: ${order.totalAmount} ₽</b>

${deliveryInfo}
  `;

  // 4. Отправляем
  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Telegram API Error:", errorData);
    }
  } catch (error) {
    console.error("❌ Ошибка сети при отправке в Telegram:", error);
  }
}