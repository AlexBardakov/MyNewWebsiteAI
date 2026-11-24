/**
 * Форматы данных API приложения (docs/app-api.md). Даты — ISO 8601 (UTC),
 * суммы — целые рубли, количество: для unit="kg" — в граммах, для "pcs" — в штуках.
 */
import type { Order, OrderItem, Certificate } from "@prisma/client";

export const ORDER_STATUSES: Record<string, string> = {
  new: "Новый",
  picking: "В сборке",
  awaiting_payment: "Ждёт оплаты",
  paid: "Оплачен",
  completed: "Выполнен",
  cancelled: "Отменён",
};

export const CERT_STATUSES: Record<string, string> = {
  PENDING: "Ожидает оплаты",
  PAID: "Оплачен",
  SENT: "Отправлен",
  USED: "Использован",
};

export const shortOrderId = (id: string) => id.slice(-6).toUpperCase();

export function orderListItem(o: Order & { _count?: { items: number } }) {
  return {
    id: o.id,
    shortId: shortOrderId(o.id),
    status: o.status,
    statusLabel: ORDER_STATUSES[o.status] || o.status,
    customerName: o.customerName,
    deliveryMethod: o.deliveryMethod,
    totalRub: o.totalRub,
    itemsCount: o._count?.items ?? null,
    createdAt: o.createdAt.toISOString(),
  };
}

export function orderDetails(o: Order & { items: OrderItem[] }) {
  return {
    ...orderListItem({ ...o, _count: { items: o.items.length } }),
    customerPhone: o.customerPhone,
    customerAddress: o.customerAddress,
    customerComment: o.customerComment,
    items: o.items.map((it) => ({
      productName: it.productName,
      variant: it.variant,
      unit: it.unit,
      quantity: it.quantity,
      priceRub: it.priceRub,
      lineTotalRub: it.lineTotalRub,
    })),
  };
}

export function certificateDetails(c: Certificate) {
  return {
    id: c.id,
    shortNumber: c.shortNumber,
    status: c.status,
    statusLabel: CERT_STATUSES[c.status] || c.status,
    amount: c.amount,
    senderName: c.senderName,
    senderContact: c.senderContact,
    recipientName: c.recipientName,
    recipientContact: c.recipientContact,
    message: c.message,
    createdAt: c.createdAt.toISOString(),
  };
}
