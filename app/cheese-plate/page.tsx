import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import CheesePlateClient, { Product, Category, ProductGroup } from "@/components/cheese-plate-client";

export const metadata: Metadata = {
  title: "Конструктор сырной тарелки | Four Kings",
  description: "Соберите идеальную сырную тарелку под ваш вкус и бюджет.",
};

export default async function CheesePlatePage() {
  // 1. Загружаем все данные
  const [productsRaw, categoriesRaw, groupsRaw] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    }),
    prisma.category.findMany({
      where: { isActive: true },
    }),
    prisma.productGroup.findMany({
      where: { useInConstructor: true },
      include: {
        products: {
          // ИСПРАВЛЕНИЕ ЗДЕСЬ:
          // Мы обращаемся к связующей таблице. Нам нужен productId товара.
          select: {
            productId: true
          }
        }
      },
    }),
  ]);

  // 2. Сериализация товаров
  const products: Product[] = productsRaw.map(p => ({
    id: p.id,
    name: p.name,
    categoryId: p.categoryId,
    imageUrl: p.imageUrl,
    priceRub: p.priceRub,
    unit: p.unit,
    remainder: p.remainder,
    avgPackWeightGrams: p.avgPackWeightGrams,
    isActive: p.isActive,
  })).filter(p => (p.unit === 'kg' ? p.remainder > 0.1 : p.remainder >= 1));

  // 3. Сериализация категорий
  const categories: Category[] = categoriesRaw.map(c => ({
    id: c.id,
    name: c.name,
    isActive: c.isActive,
    isMold: c.isMold,
  }));

  // 4. Сериализация групп
  const groups: ProductGroup[] = groupsRaw.map(g => ({
    id: g.id,
    name: g.name,
    useInConstructor: g.useInConstructor,
    basePercent: g.basePercent,
    // ИСПРАВЛЕНИЕ ЗДЕСЬ:
    // Берем productId из результата запроса выше
    productIds: g.products.map(p => p.productId),
  }));

  const initialSuggestions: any[] = [];

  return (
    <div className="container mx-auto px-4 py-8">
      <CheesePlateClient
        initialProducts={products}
        initialCategories={categories}
        initialGroups={groups}
        initialSuggestions={initialSuggestions}
      />
    </div>
  );
}