import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Eye } from "lucide-react";

// ИСПРАВЛЕНИЕ: Преобразуем входящее значение в Number перед форматированием
const formatPrice = (price: any) => {
  const value = Number(price);
  if (isNaN(value)) return "0 ₽";
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(value);
};

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(date);

const statusMap: Record<string, { label: string; color: string }> = {
  new: { label: "Новый", color: "bg-blue-500" },
  processing: { label: "В работе", color: "bg-yellow-500" },
  completed: { label: "Выполнен", color: "bg-green-500" },
  cancelled: { label: "Отменен", color: "bg-red-500" },
};

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
        _count: { select: { items: true } }
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Заказы</h1>
        <div className="text-muted-foreground text-sm">
          Всего: {orders.length}
        </div>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>№ Заказа</TableHead>
              <TableHead>Дата</TableHead>
              <TableHead>Клиент</TableHead>
              <TableHead>Сумма</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Заказов пока нет
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => {
                const status = statusMap[order.status] || { label: order.status, color: "bg-gray-500" };
                const shortId = order.id.slice(-6).toUpperCase();

                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">#{shortId}</TableCell>
                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                    <TableCell>
                        <div className="flex flex-col">
                            <span>{order.customerName}</span>
                            <span className="text-xs text-muted-foreground">{order.customerPhone}</span>
                        </div>
                    </TableCell>
                    {/* Здесь теперь цена будет корректной */}
                    <TableCell className="font-bold">{formatPrice(order.total)}</TableCell>
                    <TableCell>
                      <Badge className={`${status.color} hover:${status.color} text-white border-0`}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/orders/${order.id}`}>
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4 mr-1" />
                          Детали
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}