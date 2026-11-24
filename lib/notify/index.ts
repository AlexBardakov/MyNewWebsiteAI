/**
 * Уведомления администраторам о новых заказах и сертификатах.
 *
 * Каналы:
 *   - ВКонтакте (lib/notify/vk.ts) — беседа/сообщения от сообщества магазина;
 *   - Android-приложение админа — событие пишется в журнал AppEvent, приложение
 *     забирает его опросом раз в ~15 минут (GET /api/app/events, docs/app-api.md).
 *
 * Содержание — ОБЕЗЛИЧЕННОЕ (152-ФЗ, Политика п. 7.3; решение заказчика 24.11.2026):
 * номер, способ получения, состав, сумма. Имя, телефон, адрес и комментарий покупателя
 * НЕ отправляются — они открываются по ссылке на наш сайт, действующей 4 часа
 * (lib/notify/view-link.ts), или в админке.
 *
 * Вызывается «в фоне» (без await) — сбой уведомления не мешает оформлению заказа.
 */
import { prisma } from "@/lib/prisma";
import { sendVkMessage } from "./vk";
import { createViewLink, VIEW_LINK_TTL_HOURS } from "./view-link";

const rub = (n: number) => `${Math.round(n).toLocaleString("ru-RU")} ₽`;

/** Склонение: 1 позиция, 2 позиции, 5 позиций. */
function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

/**
 * Запись в журнал событий для Android-приложения. Тексты обезличенные — их видно
 * в шторке и на экране блокировки. Ошибка записи не мешает остальным каналам.
 */
async function recordAppEvent(type: string, entityId: string, title: string, body: string) {
  try {
    await prisma.appEvent.create({ data: { type, entityId, title, body } });
  } catch (e) {
    console.error("AppEvent: не удалось записать событие:", e);
  }
}

export interface NotifyOrderData {
  id: string;
  deliveryMethod: string; // "delivery" | "pickup"
  totalRub: number;
  /** Позиции из БД: для unit="kg" quantity — в граммах, для "pcs" — в штуках. */
  items: { productName: string; variant: string | null; unit: string; quantity: number; priceRub: number; lineTotalRub: number }[];
}

export async function notifyNewOrder(order: NotifyOrderData): Promise<void> {
  const shortId = order.id.slice(-6).toUpperCase();
  const delivery = order.deliveryMethod === "delivery" ? "Доставка" : "Самовывоз";
  const n = order.items.length;

  // 1) Журнал для приложения — первым, чтобы событие не потерялось при сбое ВК.
  await recordAppEvent(
    "order.created",
    order.id,
    `Новый заказ #${shortId}`,
    `${delivery} · ${n} ${plural(n, "позиция", "позиции", "позиций")} · ${rub(order.totalRub)}`,
  );

  // 2) ВКонтакте.
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
  await recordAppEvent(
    "certificate.created",
    cert.id,
    `Новый сертификат №${cert.shortNumber}`,
    `${rub(cert.amount)} · ожидает оплаты`,
  );

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
