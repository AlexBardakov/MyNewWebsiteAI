// lib/telegram.ts
import axios from 'axios';
import { SocksProxyAgent } from 'socks-proxy-agent';

// Инициализируем агента. Если переменной нет (например, на локальном ПК), пойдет напрямую.
const proxyUrl = process.env.TELEGRAM_PROXY;
const httpsAgent = proxyUrl ? new SocksProxyAgent(proxyUrl) : undefined;

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
    unit: string;
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
      let qtyString = "";
      if (item.unit === 'kg') {
        qtyString = `${item.quantity.toFixed(3)} кг`;
      } else {
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

  // 4. Отправляем через axios с агентом
  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    await axios.post(url, {
      chat_id: chatId,
      text: message,
      parse_mode: "HTML",
    }, { httpsAgent }); // <-- Заворачиваем трафик в туннель
  } catch (error) {
    console.error("❌ Ошибка сети при отправке в Telegram:", error);
  }
}

export async function sendTelegramMessage(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

  if (!token || !chatId) {
    console.error("❌ Ошибка: Не заданы переменные окружения для Telegram.");
    return;
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    await axios.post(url, {
      chat_id: chatId,
      text: text,
      parse_mode: "HTML",
    }, { httpsAgent }); // <-- Заворачиваем трафик в туннель
  } catch (error) {
    console.error("❌ Ошибка сети при отправке сообщения в Telegram:", error);
  }
}