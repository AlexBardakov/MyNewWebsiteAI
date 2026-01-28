import CatalogClient from "@/components/catalog-client";
import { db } from "@/lib/db"; // Лучше использовать db из вашего @/lib/db, если он там настроен, или prisma

export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  // 1. Загружаем категории (для меню)
  const categories = await db.category.findMany({
    orderBy: { displayOrder: "asc" },
    where: { isActive: true },
  });

  // 2. Загружаем товары (для отображения)
  const productsRaw = await db.product.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
    include: {
      variants: true, // <--- ОШИБКА 1 БЫЛА ТУТ: Обязательно загружаем варианты
    },
  });

  // 3. Подготавливаем данные
  const products = productsRaw.map((p) => {
    // Логика расчета шага (оставляем вашу логику)
    let step = 1;
    if (p.unit === 'kg') {
        if (p.avgPackWeightGrams && p.avgPackWeightGrams > 0) {
            step = p.avgPackWeightGrams / 1000;
        } else {
            step = 0.5; // Дефолтный шаг, если вес не указан
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
        remainder: p.remainder,
        variants: p.variants, // <--- ОШИБКА 2 БЫЛА ТУТ: Передаем массив вариантов дальше
    };
  });

  return <CatalogClient categories={categories} initialProducts={products} />;
}