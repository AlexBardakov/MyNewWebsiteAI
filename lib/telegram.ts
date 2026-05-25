// lib/telegram.ts
//
// ВАЖНО (152-ФЗ): Этот канал уведомлений считается ОБЕЗЛИЧЕННЫМ.
// Сюда НЕ передаются персональные данные покупателя (имя, телефон, адрес, комментарий).
// Все ПДн смотрятся администратором только в админке сайта (серверы РФ).
// В Telegram уходит только служебная сводка: ID заказа, тип получения, состав, сумма,
// и deep link на страницу заказа в админке.
//
// Если потребуется снова отправлять ПДн в Telegram — это будет трансграничная передача
// (Telegram FZ-LLC, ОАЭ), для которой нужно: отдельное уведомление в РКН, явное
// согласие субъекта ПДн, и описание этого канала в Политике конфиденциальности.
// На момент данной редакции (26.05.2026) выбран обезличенный режим.

import axios from 'axios';
import { SocksProxyAgent } from 'socks-proxy-agent';

// Инициализируем агента. Если переменной нет — пойдёт напрямую.
const proxyUrl = process.env.TELEGRAM_PROXY;
const httpsAgent = proxyUrl ? new SocksProxyAgent(proxyUrl) : undefined;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://fourkings.ru';

// ---------- ЗАКАЗЫ ----------

export interface TelegramOrderData {
  /**
   * Короткий ID заказа для отображения (например, "0DFF45" — последние 6 символов uuid).
   * НЕ персональные данные.
   */
  shortId: string;

  /**
   * Полный UUID заказа из БД — используется ТОЛЬКО для построения ссылки на админку.
   * В тексте сообщения не отображается.
   */
  dbId: string;

  /** "delivery" | "pickup" — обезличенный атрибут заказа. */
  deliveryMethod: string;

  /** Итоговая сумма заказа в рублях. */
  totalAmount: number;

  /** Состав заказа. Сами по себе товары — не ПДн. */
  items: {
    name: string;
    /** Для unit="kg" — в килограммах (например, 0.6). Для "pcs" — штуки. */
    quantity: number;
    price: number;
    unit: string;
    /** Опционально — вариант товара (например "Лимон"). */
    variant?: string | null;
  }[];
}

export async function sendTelegramNotification(order: TelegramOrderData) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

  if (!token || !chatId) {
    console.error("Telegram: переменные окружения TELEGRAM_BOT_TOKEN / TELEGRAM_ADMIN_CHAT_ID не заданы.");
    return;
  }

  // 1. Список товаров (с вариантами, если есть)
  const itemsList = order.items
    .map((item, index) => {
      const lineTotal = Math.round(item.price * item.quantity);
      const qtyString =
        item.unit === 'kg'
          ? `${item.quantity.toFixed(3)} кг`
          : `${item.quantity} шт.`;

      const displayName = item.variant
        ? `${item.name} (${item.variant})`
        : item.name;

      return `${index + 1}. <b>${escapeHtml(displayName)}</b>\n   └ ${qtyString} × ${item.price} ₽ = ${lineTotal} ₽`;
    })
    .join("\n");

  // 2. Тип получения (без адреса!)
  const isDelivery = order.deliveryMethod === "delivery";
  const deliveryLabel = isDelivery ? "🚚 Доставка" : "🏪 Самовывоз";

  // 3. Deep link на админку
  const adminLink = `${SITE_URL}/admin/orders/${order.dbId}`;

  // 4. Собираем сообщение — БЕЗ персональных данных
  const message = `📦 <b>НОВЫЙ ЗАКАЗ #${order.shortId}</b>
${deliveryLabel}
━━━━━━━━━━━━━━━━
<b>Состав:</b>
${itemsList}
━━━━━━━━━━━━━━━━
💰 <b>ИТОГО: ${order.totalAmount.toLocaleString('ru-RU')} ₽</b>

👤 Контакты клиента и адрес — в админке:
<a href="${adminLink}">${adminLink}</a>`;

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    await axios.post(
      url,
      {
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      },
      { httpsAgent }
    );
  } catch (error) {
    console.error("Telegram: ошибка отправки уведомления о заказе:", error);
  }
}

// ---------- СЕРТИФИКАТЫ (тоже обезличенно) ----------

export interface TelegramCertificateData {
  /** Короткий 6-значный номер сертификата. Сам по себе не идентифицирует лицо. */
  shortNumber: string;
  /** Полный ID сертификата для построения deep-link на админку. */
  dbId: string;
  /** Номинал сертификата в рублях. */
  amount: number;
}

export async function sendTelegramCertificateNotification(data: TelegramCertificateData) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

  if (!token || !chatId) {
    console.error("Telegram: переменные окружения TELEGRAM_BOT_TOKEN / TELEGRAM_ADMIN_CHAT_ID не заданы.");
    return;
  }

  // TODO (этап доработки админки): страница /admin/certificates/[id] пока не существует,
  // поэтому ведём админа на список сертификатов. Там он найдёт нужный по shortNumber.
  // Когда сделаем детальную страницу — заменить на `${SITE_URL}/admin/certificates/${data.dbId}`.
  const adminLink = `${SITE_URL}/admin/certificates`;
  void data.dbId; // зарезервировано на будущее (для прямой ссылки)

  const message = `🎁 <b>НОВЫЙ СЕРТИФИКАТ #${data.shortNumber}</b>
Номинал: <b>${data.amount.toLocaleString('ru-RU')} ₽</b>

👤 Данные отправителя/получателя — в админке (найти по номеру выше):
<a href="${adminLink}">${adminLink}</a>`;

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    await axios.post(
      url,
      {
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      },
      { httpsAgent }
    );
  } catch (error) {
    console.error("Telegram: ошибка отправки уведомления о сертификате:", error);
  }
}

// ---------- УНИВЕРСАЛЬНАЯ ОТПРАВКА ----------

/**
 * Универсальный метод. Использовать только для обезличенных сообщений
 * (например, ответы из webhook `/api/telegram`). Категорически не передавать ПДн.
 */
export async function sendTelegramMessage(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

  if (!token || !chatId) {
    console.error("Telegram: переменные окружения TELEGRAM_BOT_TOKEN / TELEGRAM_ADMIN_CHAT_ID не заданы.");
    return;
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    await axios.post(
      url,
      {
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      },
      { httpsAgent }
    );
  } catch (error) {
    console.error("Telegram: ошибка отправки служебного сообщения:", error);
  }
}

// ---------- УТИЛИТЫ ----------

/** Минимальный HTML-escape для текста, который мы вставляем в parse_mode: "HTML". */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
