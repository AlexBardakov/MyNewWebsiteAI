/**
 * GET /api/app/orders?limit=30&before=<ISO-дата> — заказы, новые сверху.
 * before — для подгрузки следующей страницы (createdAt последнего заказа в списке).
 * Ответ: { orders: [{ id, shortId, status, statusLabel, customerName, deliveryMethod,
 *          totalRub, itemsCount, createdAt }] }
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAppDevice, badRequest } from "@/lib/app-api/auth";
import { orderListItem } from "@/lib/app-api/dto";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAppDevice(req);
  if (auth instanceof NextResponse) return auth;

  const sp = new URL(req.url).searchParams;
  const limit = Math.min(Math.max(Number(sp.get("limit") ?? "30") || 30, 1), 100);
  const beforeRaw = sp.get("before");
  const before = beforeRaw ? new Date(beforeRaw) : null;
  if (before && Number.isNaN(before.getTime())) return badRequest("before должен быть датой ISO 8601");

  const orders = await prisma.order.findMany({
    where: before ? { createdAt: { lt: before } } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { _count: { select: { items: true } } },
  });
  return NextResponse.json({ orders: orders.map(orderListItem) });
}
