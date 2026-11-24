/**
 * Уведомления администраторам о новых заказах и сертификатах.
 *
 * Каналы:
 *   - ВКонтакте (lib/notify/vk.ts) — беседа/сообщения от сообщества магазина;
 *   - (позже) push в админское приложение — подключится сюда же.
 *
 * Содержание — ОБЕЗЛИЧЕННОЕ (152-ФЗ, Политика п. 7.3; решение заказчика 24.11.2026):
 * номер, способ получения, состав, сумма. Имя, телефон, адрес и комментарий покупателя
 * НЕ отправляются — они открываются по ссылке на наш сайт, действующей 4 часа
 * (lib/notify/view-link.ts), или в админке.
 *
 * Вызывается «в фоне» (без await) — сбой уведомления не мешает оформлению заказа.
 */
import { sendVkMessage } from "./vk";
import { createViewLink, VIEW_LINK_TTL_HOURS } from "./view-link";

const rub = (n: number) => `${Math.round(n).toLocaleString("ru-RU")} ₽`;

export interface NotifyOrderData {
  id: string;
  deliveryMethod: string; // "delivery" | "pickup"
  totalRub: number;
  /** Позиции из БД: для unit="kg" quantity — в граммах, для "pcs" — в штуках. */
  items: { productName: string; variant: string | null; unit: string; quantity: number; priceRub: number; lineTotalRub: number }[];
}

export async function notifyNewOrder(order: NotifyOrderData): Promise<void> {
  const shortId = order.id.slice(-6).toUpperCase();
  const link = await createViewLink("order", order.id);

  const items = order.items
    .map((it, i) => {
      const name = it.variant ? `${it.productName} (${it.variant})` : it.productName;
      const qty = it.unit === "kg"
        ? `${Number((it.quantity / 1000).toFixed(3)).toLocaleString("ru-RU")} кг`
        : `${it.quantity} шт`;
      return `${i + 1}. ${name}\n    ${qty} × ${rub(it.priceRub)} = ${rub(it.lineTotalRub)}`;
    })
    .join("\n");

  const text = [
    `🧀 Новый заказ #${shortId}`,
    order.deliveryMethod === "delivery" ? "🚚 Доставка" : "🏪 Самовывоз",
    "",
    items,
    "",
    `💰 Итого: ${rub(order.totalRub)}`,
    "",
    `👤 Контакты и адрес (ссылка действует ${VIEW_LINK_TTL_HOURS} часа):`,
    link,
  ].join("\n");

  await sendVkMessage(text);
}

export interface NotifyCertificateData {
  id: string;
  shortNumber: string;
  amount: number;
}

export async function notifyNewCertificate(cert: NotifyCertificateData): Promise<void> {
  const link = await createViewLink("cert", cert.id);
  const text = [
    `🎁 Новый подарочный сертификат №${cert.shortNumber}`,
    `Номинал: ${rub(cert.amount)} · ожидает оплаты`,
    "",
    `👤 Отправитель и получатель (ссылка действует ${VIEW_LINK_TTL_HOURS} часа):`,
    link,
  ].join("\n");

  await sendVkMessage(text);
}
