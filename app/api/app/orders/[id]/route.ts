/** GET /api/app/orders/:id — заказ целиком, с контактами покупателя и составом. */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAppDevice } from "@/lib/app-api/auth";
import { orderDetails } from "@/lib/app-api/dto";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAppDevice(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) return NextResponse.json({ error: "not_found", message: "Заказ не найден" }, { status: 404 });
  return NextResponse.json({ order: orderDetails(order) });
}
