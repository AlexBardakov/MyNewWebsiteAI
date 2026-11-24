/**
 * GET /api/app/products — все товары для экрана «Остатки» в приложении,
 * в том же порядке, что и в веб-админке (категории по displayOrder, внутри — по displayOrder).
 * Ответ: { categories: [{ id, name }], products: [{ id, name, categoryId, unit, remainder,
 *          isActive, priceRub, variants, updatedAt }] }
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAppDevice } from "@/lib/app-api/auth";
import { productStockItem } from "@/lib/app-api/dto";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAppDevice(req);
  if (auth instanceof NextResponse) return auth;

  const [categories, products] = await Promise.all([
    prisma.category.findMany({ orderBy: { displayOrder: "asc" }, select: { id: true, name: true } }),
    prisma.product.findMany({
      orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
      include: { variants: { select: { name: true } } },
    }),
  ]);

  return NextResponse.json({ categories, products: products.map(productStockItem) });
}
