import { prisma } from "@/lib/prisma";
import CatalogClient from "@/components/catalog-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Каталог сыров | Сырная лавка",
  description: "Полный ассортимент наших сыров и деликатесов",
};

export default async function CatalogPage() {
  // 1. Получаем активные категории для фильтров
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: 'asc' },
  });

  // 2. Получаем ВСЕ активные товары (убрали фильтр по плесени)
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      // Фильтр isMold убран, чтобы в каталоге были все товары
    },
    orderBy: { displayOrder: 'asc' },
    include: {
      category: true,
    },
  });

  return (
    <div className="container py-10">
      <h1 className="text-4xl font-bold mb-8 text-primary">Каталог</h1>
      <CatalogClient initialProducts={products} categories={categories} />
    </div>
  );
}