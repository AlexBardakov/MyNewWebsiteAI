import CatalogClient from "@/components/catalog-client"; // Без скобок!
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  const categories = await prisma.category.findMany({
    orderBy: { displayOrder: "asc" },
    where: { isActive: true }
  });

  const productsRaw = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
  });

  const products = productsRaw.map((p) => {
    let step = 1;

    if (p.unit === 'kg') {
        if (p.avgPackWeightGrams && p.avgPackWeightGrams > 0) {
            step = p.avgPackWeightGrams / 1000;
        } else {
            step = 0.5;
        }
    }

    return {
        id: p.id,
        name: p.name,
        description: p.description,
        priceRub: p.priceRub,
        imageUrl: p.imageUrl,
        unit: p.unit,
        categoryId: p.categoryId,
        step: step,
        avgPackWeightGrams: p.avgPackWeightGrams,
        remainder: p.remainder
    };
  });

  // ВАЖНО: передаем prop как initialProducts, так как именно так он назван в CatalogClient
  return <CatalogClient categories={categories} initialProducts={products} />;
}