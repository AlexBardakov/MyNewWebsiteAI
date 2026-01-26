import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Phone, User, Truck, CreditCard } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { updateOrderStatus } from "../actions"; // Убедись, что этот файл существует

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminOrderDetailsPage({ params }: PageProps) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order) {
    notFound();
  }

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      new: "Новый",
      picking: "В сборке",
      awaiting_payment: "Ждет оплаты",
      paid: "Оплачен",
      completed: "Выполнен",
      cancelled: "Отменен",
    };
    return map[status] || status;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Хедер с навигацией */}
      <div className="flex items-center gap-4">
        <Link href="/admin/orders">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Заказ #{order.id.slice(-6).toUpperCase()}</h1>
        <Badge variant="outline" className="ml-2 text-base px-3 py-1">
            {getStatusLabel(order.status)}
        </Badge>
      </div>

      <div className="grid md:grid-cols-3 gap-6">

        {/* Левая колонка: Инфо о заказе и клиенте */}
        <div className="md:col-span-2 space-y-6">
            {/* Состав заказа */}
            <Card>
                <CardHeader>
                    <CardTitle>Состав заказа</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Товар</TableHead>
                                <TableHead className="text-center">Кол-во</TableHead>
                                <TableHead className="text-right">Цена</TableHead>
                                <TableHead className="text-right">Сумма</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {order.items.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.productName}</TableCell>
                                    <TableCell className="text-center whitespace-nowrap">
                                        {/* ЛОГИКА ОТОБРАЖЕНИЯ ЕДИНИЦ ИЗМЕРЕНИЯ */}
                                        {item.unit === 'kg'
                                            ? <>{(item.quantity / 1000).toFixed(3)} <span className="text-muted-foreground text-xs">кг</span></>
                                            : <>{item.quantity} <span className="text-muted-foreground text-xs">шт</span></>
                                        }
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {item.priceRub} ₽
                                    </TableCell>
                                    <TableCell className="text-right font-bold">
                                        {item.lineTotalRub} ₽
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    {/* Итоговая сумма */}
                    <div className="flex justify-end p-6 border-t bg-gray-50">
                         <div className="flex flex-col items-end gap-1">
                            <span className="text-muted-foreground">Итого к оплате:</span>
                            <span className="text-2xl font-bold">{order.totalRub.toLocaleString("ru-RU")} ₽</span>
                         </div>
                    </div>
                </CardContent>
            </Card>

            {/* Комментарий (если есть) */}
            {order.customerComment && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Комментарий клиента</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm bg-secondary/20 p-3 rounded-md italic">
                            "{order.customerComment}"
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>

        {/* Правая колонка: Управление и детали */}
        <div className="space-y-6">

            {/* Карточка Клиента */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Данные клиента</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                        <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                            <div className="font-medium">{order.customerName}</div>
                            <div className="text-sm text-muted-foreground">Клиент</div>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                            <div className="font-medium">{order.customerPhone}</div>
                        </div>
                    </div>
                    <div className="border-t my-2" />
                    <div className="flex items-start gap-3">
                        {order.deliveryMethod === 'delivery' ? (
                            <Truck className="h-5 w-5 text-primary mt-0.5" />
                        ) : (
                            <MapPin className="h-5 w-5 text-primary mt-0.5" />
                        )}
                        <div>
                            <div className="font-medium">
                                {order.deliveryMethod === 'delivery' ? 'Доставка' : 'Самовывоз'}
                            </div>
                            <div className="text-sm text-muted-foreground leading-relaxed mt-1">
                                {order.customerAddress || 'Адрес не указан'}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Управление статусом */}
            <Card className="border-primary/20 shadow-md">
                <CardHeader>
                    <CardTitle className="text-lg">Управление заказом</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                    <form action={updateOrderStatus.bind(null, order.id, "picking")}>
                        <Button variant="outline" className="w-full justify-start" disabled={order.status === 'picking'}>
                            🔨 В сборку
                        </Button>
                    </form>
                    <form action={updateOrderStatus.bind(null, order.id, "completed")}>
                        <Button className="w-full justify-start bg-green-600 hover:bg-green-700" disabled={order.status === 'completed'}>
                            ✅ Выполнен
                        </Button>
                    </form>
                    <form action={updateOrderStatus.bind(null, order.id, "cancelled")}>
                        <Button variant="destructive" className="w-full justify-start" disabled={order.status === 'cancelled'}>
                            ❌ Отменить
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}