/**
 * Просмотр заказа / сертификата по ссылке из уведомления во ВКонтакте — без входа
 * в админку, ссылка действует 4 часа (lib/notify/view-link.ts).
 *
 * Только просмотр: ничего не меняет. Статусы и прочие действия — в админке.
 * Страница закрыта от индексации, не кэшируется (рендер на каждый запрос),
 * в заголовке вкладки нет персональных данных.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { verifyViewLink, VIEW_LINK_TTL_HOURS } from "@/lib/notify/view-link";
import { normalizePhone } from "@/lib/phone";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, MapPin, Truck, Store, MessageSquare, Clock, Gift, User } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Просмотр заказа",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

const tomsk = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "Asia/Tomsk",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});
const tomskTime = new Intl.DateTimeFormat("ru-RU", { timeZone: "Asia/Tomsk", hour: "2-digit", minute: "2-digit" });
const rub = (n: number) => `${Math.round(n).toLocaleString("ru-RU")} ₽`;

const ORDER_STATUS: Record<string, string> = {
  new: "Новый",
  picking: "В сборке",
  awaiting_payment: "Ждёт оплаты",
  paid: "Оплачен",
  completed: "Выполнен",
  cancelled: "Отменён",
};
const CERT_STATUS: Record<string, string> = {
  PENDING: "Ожидает оплаты",
  PAID: "Оплачен",
  SENT: "Отправлен",
  USED: "Использован",
};

/** Кнопка «позвонить», если строка похожа на телефон; иначе просто текст (например, email). */
function Contact({ value }: { value: string }) {
  const p = normalizePhone(value);
  if (p.valid && p.e164) {
    return (
      <Button asChild size="lg" className="w-full sm:w-auto">
        <a href={`tel:${p.e164}`}>
          <Phone className="mr-2 h-4 w-4" />
          {value}
        </a>
      </Button>
    );
  }
  return <span className="font-medium break-all">{value}</span>;
}

function Notice({ title, text }: { title: string; text: string }) {
  return (
    <div className="container mx-auto max-w-lg px-4 py-16 text-center space-y-4">
      <h1 className="text-2xl">{title}</h1>
      <p className="text-muted-foreground">{text}</p>
      <Button asChild>
        <Link href="/admin/orders">Открыть админку</Link>
      </Button>
    </div>
  );
}

export default async function ViewLinkPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const check = await verifyViewLink(token);

  if (check.status === "expired") {
    return (
      <Notice
        title="Ссылка устарела"
        text={`Ссылка из уведомления действует ${VIEW_LINK_TTL_HOURS} часа. Откройте заказ в админке — там все данные.`}
      />
    );
  }
  if (check.status === "invalid") {
    return <Notice title="Ссылка недействительна" text="Проверьте, что ссылка скопирована целиком, или откройте админку." />;
  }

  const validUntil = (
    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Clock className="h-3.5 w-3.5" />
      Ссылка действует до {tomskTime.format(check.expiresAt)} (по Томску)
    </p>
  );

  // ---------- ЗАКАЗ ----------
  if (check.kind === "order") {
    const order = await prisma.order.findUnique({ where: { id: check.id }, include: { items: true } });
    if (!order) return <Notice title="Заказ не найден" text="Возможно, он был удалён. Проверьте список заказов в админке." />;

    const isDelivery = order.deliveryMethod === "delivery";
    return (
      <div className="container mx-auto max-w-2xl px-4 py-6 md:py-10 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl md:text-3xl">Заказ #{order.id.slice(-6).toUpperCase()}</h1>
          <Badge variant="outline" className="text-sm">{ORDER_STATUS[order.status] || order.status}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">Оформлен {tomsk.format(order.createdAt)}</p>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg"><User className="h-5 w-5" /> {order.customerName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Contact value={order.customerPhone} />
            <div className="flex items-start gap-2">
              {isDelivery ? <Truck className="mt-0.5 h-4 w-4 shrink-0" /> : <Store className="mt-0.5 h-4 w-4 shrink-0" />}
              <div>
                <div className="font-medium">{isDelivery ? "Доставка" : "Самовывоз"}</div>
                {isDelivery && order.customerAddress && (
                  <div className="flex items-start gap-1.5 text-sm mt-1">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span>{order.customerAddress}</span>
                  </div>
                )}
              </div>
            </div>
            {order.customerComment && (
              <div className="flex items-start gap-2 rounded-lg bg-secondary/30 p-3 text-sm">
                <MessageSquare className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="whitespace-pre-wrap">{order.customerComment}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-lg">Состав</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {order.items.map((item) => {
              const qty = item.unit === "kg"
                ? `${Number((item.quantity / 1000).toFixed(3)).toLocaleString("ru-RU")} кг`
                : `${item.quantity} шт`;
              return (
                <div key={item.id} className="flex justify-between gap-3 border-b border-border/60 pb-3 last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <div className="font-medium">{item.productName}</div>
                    {item.variant && <div className="text-xs text-muted-foreground">{item.variant}</div>}
                    <div className="text-sm text-muted-foreground">{qty} × {rub(item.priceRub)}</div>
                  </div>
                  <div className="font-medium tabular-nums whitespace-nowrap">{rub(item.lineTotalRub)}</div>
                </div>
              );
            })}
            {/* Как в админке: итог = totalRub (стоимость доставки сайт сейчас не считает). */}
            <div className="flex justify-between pt-2 text-lg font-semibold">
              <span>Итого</span><span>{rub(order.totalRub)}</span>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {validUntil}
          <Button asChild variant="outline"><Link href={`/admin/orders/${order.id}`}>Открыть в админке</Link></Button>
        </div>
      </div>
    );
  }

  // ---------- СЕРТИФИКАТ ----------
  const cert = await prisma.certificate.findUnique({ where: { id: check.id } });
  if (!cert) return <Notice title="Сертификат не найден" text="Возможно, он был удалён. Проверьте список сертификатов в админке." />;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6 md:py-10 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl md:text-3xl flex items-center gap-2"><Gift className="h-6 w-6" /> Сертификат №{cert.shortNumber}</h1>
        <Badge variant="outline" className="text-sm">{CERT_STATUS[cert.status] || cert.status}</Badge>
      </div>
      <p className="text-sm text-muted-foreground">Номинал <b>{rub(cert.amount)}</b> · оформлен {tomsk.format(cert.createdAt)}</p>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-lg">От кого: {cert.senderName}</CardTitle></CardHeader>
        <CardContent><Contact value={cert.senderContact} /></CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-lg">Кому: {cert.recipientName}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Contact value={cert.recipientContact} />
          {cert.message && (
            <div className="flex items-start gap-2 rounded-lg bg-secondary/30 p-3 text-sm">
              <MessageSquare className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="whitespace-pre-wrap">{cert.message}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {validUntil}
        <Button asChild variant="outline"><Link href="/admin/certificates">Открыть в админке</Link></Button>
      </div>
    </div>
  );
}
