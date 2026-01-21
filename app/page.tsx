import { prisma } from "@/lib/prisma";
// ИСПРАВЛЕННЫЙ ИМПОРТ (kebab-case имя файла):
import { ProductCard } from "@/components/product-card";

export default async function HomePage() {
  const products = await prisma.product.findMany({
    where: { isActive: true }, // Убрали isMold, если его нет в модели, или оставьте если есть
    take: 8,
    orderBy: { displayOrder: 'asc' },
    include: { category: true }
  });

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Популярные сыры</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}