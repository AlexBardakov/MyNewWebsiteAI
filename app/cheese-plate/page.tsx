import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import CheesePlateClient, { Product, Category, ProductGroup } from "@/components/cheese-plate-client";
// Импортируем функцию билдера напрямую (это серверный компонент, здесь можно)
import { buildSuggestions } from "@/lib/cheesePlateBuilder";

export const metadata: Metadata = {
  title: "Конструктор сырной тарелки | Four Kings",
  description: "Соберите идеальную сырную тарелку под ваш вкус и бюджет.",
};

export default async function CheesePlatePage() {
  // 1. Загружаем все данные и сразу генерируем 3 варианта тарелок
  const [productsRaw, categoriesRaw, groupsRaw, suggestionsRaw] = await Promise.all([
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
          select: { productId: true }
        }
      },
      orderBy: { displayOrder: 'asc' } // Важно для порядка групп
    }),
    // Сразу строим предложения на сервере
    buildSuggestions(3)
  ]);

  // 2. Сериализация (приведение типов для передачи в клиентский компонент)
  // Next.js не передает Decimal и Date, поэтому приводим к number/string

  const products: Product[] = productsRaw.map(p => ({
    id: p.id,
    name: p.name,
    categoryId: p.categoryId,
    imageUrl: p.imageUrl,
    priceRub: Number(p.priceRub),
    unit: p.unit,
    remainder: Number(p.remainder),
    avgPackWeightGrams: p.avgPackWeightGrams ? Number(p.avgPackWeightGrams) : null,
    isActive: p.isActive,
  })).filter(p => (p.unit === 'kg' ? p.remainder > 0.1 : p.remainder >= 1));

  const categories: Category[] = categoriesRaw.map(c => ({
    id: c.id,
    name: c.name,
    isActive: c.isActive,
    isMold: c.isMold,
  }));

  const groups: ProductGroup[] = groupsRaw.map(g => ({
    id: g.id,
    name: g.name,
    useInConstructor: g.useInConstructor,
    basePercent: g.basePercent ?? 0,
    productIds: g.products.map(p => p.productId),
  }));

  // Сериализация предложений (тут тоже могут быть Decimal внутри)
  const initialSuggestions = JSON.parse(JSON.stringify(suggestionsRaw));

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