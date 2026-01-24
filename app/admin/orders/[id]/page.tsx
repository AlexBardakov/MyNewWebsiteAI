import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft, Phone, MapPin, MessageSquare } from "lucide-react";
import { notFound } from "next/navigation";
import { updateOrderStatus } from "../actions";

// ИСПРАВЛЕНИЕ: Функция форматирования с безопасным преобразованием
const formatPrice = (price: any) => {
  const value = Number(price);
  if (isNaN(value)) return "0 ₽";
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(value);
};

export default async function OrderDetailsPage({ params }: { params: { id: string } }) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order) return notFound();

  const statusMap: Record<string, string> = {
    new: "Новый",
    processing: "В работе",
    completed: "Выполнен",
    cancelled: "Отменен",
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link href="/admin/orders">
        <Button variant="ghost" className="pl-0 hover:pl-2 transition-all">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад к списку
        </Button>
      </Link>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            Заказ #{order.id.slice(-6).toUpperCase()}
            <Badge variant="outline" className="text-lg px-3 py-1">
              {statusMap[order.status] || order.status}
            </Badge>
          </h1>
          <p className="text-muted-foreground mt-1">
            от {new Date(order.createdAt).toLocaleString("ru-RU")}
          </p>
        </div>

        <div className="flex gap-2">
            <form action={updateOrderStatus}>
                <input type="hidden" name="id" value={order.id} />
                <input type="hidden" name="status" value="processing" />
                <Button type="submit" variant="outline" disabled={order.status === 'processing'}>В работу</Button>
            </form>
            <form action={updateOrderStatus}>
                <input type="hidden" name="id" value={order.id} />
                <input type="hidden" name="status" value="completed" />
                <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={order.status === 'completed'}>Выполнить</Button>
            </form>
             <form action={updateOrderStatus}>
                <input type="hidden" name="id" value={order.id} />
                <input type="hidden" name="status" value="cancelled" />
                <Button type="submit" variant="destructive" disabled={order.status === 'cancelled'}>Отменить</Button>
            </form>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Состав заказа</h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-3 border-b last:border-0">
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-muted-foreground">
                       {item.quantity} шт x {formatPrice(item.price)}
                    </div>
                  </div>
                  <div className="font-bold">
                    {formatPrice(item.total)}
                  </div>
                </div>
              ))}
              <div className="flex justify-between items-center pt-4 text-xl font-bold">
                <span>Итого</span>
                {/* Исправленное отображение итоговой суммы */}
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-muted-foreground uppercase text-xs tracking-wider">Клиент</h3>
            <div className="font-medium text-lg">{order.customerName}</div>

            <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 mt-1 text-primary" />
                <a href={`tel:${order.customerPhone}`} className="hover:underline">{order.customerPhone}</a>
            </div>

            {order.customerAddress && (
                <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 mt-1 text-primary" />
                    <span className="text-sm">{order.customerAddress}</span>
                </div>
            )}
             {order.deliveryType && (
                <div className="flex items-start gap-3">
                    <span className="text-xl">🚚</span>
                    <span className="text-sm pt-1">
                        {order.deliveryType === 'delivery' ? 'Доставка' : 'Самовывоз'}
                    </span>
                </div>
            )}
          </div>

          {order.comment && (
            <div className="rounded-xl border bg-card p-6 shadow-sm space-y-2">
                <h3 className="font-semibold text-muted-foreground uppercase text-xs tracking-wider flex items-center gap-2">
                    <MessageSquare className="w-3 h-3" /> Комментарий
                </h3>
                <p className="text-sm bg-secondary/20 p-3 rounded-lg italic">
                    "{order.comment}"
                </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}