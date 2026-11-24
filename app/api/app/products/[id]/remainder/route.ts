/**
 * POST /api/app/products/:id/remainder — новый остаток товара из приложения.
 * Тело: { "remainder": 3 } — целое число от 0 до 100000 (кг или шт, как в веб-админке).
 * 0 = «нет в наличии» на сайте. Ответ: { product } — товар после изменения.
 * Каталог и конструктор тарелки рендерятся на каждый запрос — изменение видно сразу.
 */
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAppDevice, badRequest } from "@/lib/app-api/auth";
import { productStockItem } from "@/lib/app-api/dto";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAppDevice(req);
  if (auth instanceof NextResponse) return auth;

  let body: { remainder?: unknown };
  try {
    body = await req.json();
  } catch {
    return badRequest("Ожидается JSON");
  }
  const remainder = body.remainder;
  if (typeof remainder !== "number" || !Number.isInteger(remainder) || remainder < 0 || remainder > 100_000) {
    return badRequest("Остаток — целое число от 0 до 100000");
  }

  const { id } = await params;
  const exists = await prisma.product.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return NextResponse.json({ error: "not_found", message: "Товар не найден" }, { status: 404 });

  const product = await prisma.product.update({
    where: { id },
    data: { remainder },
    include: { variants: { select: { name: true } } },
  });
  revalidatePath("/admin/products");
  return NextResponse.json({ product: productStockItem(product) });
}
