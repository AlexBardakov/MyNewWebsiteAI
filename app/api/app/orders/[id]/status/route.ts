/**
 * POST /api/app/orders/:id/status — смена статуса заказа из приложения.
 * Тело: { "status": "picking" | "completed" | "cancelled" | ... (см. ORDER_STATUSES) }
 * Ответ: { order } — заказ целиком после изменения.
 */
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAppDevice, badRequest } from "@/lib/app-api/auth";
import { ORDER_STATUSES, orderDetails } from "@/lib/app-api/dto";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAppDevice(req);
  if (auth instanceof NextResponse) return auth;

  let body: { status?: unknown };
  try {
    body = await req.json();
  } catch {
    return badRequest("Ожидается JSON");
  }
  const status = typeof body.status === "string" ? body.status : "";
  if (!(status in ORDER_STATUSES)) return badRequest("Неизвестный статус");

  const { id } = await params;
  const exists = await prisma.order.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return NextResponse.json({ error: "not_found", message: "Заказ не найден" }, { status: 404 });

  const order = await prisma.order.update({ where: { id }, data: { status }, include: { items: true } });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  return NextResponse.json({ order: orderDetails(order) });
}
