import { notFound } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ProductActions } from "@/components/product-actions";

// В Next.js 15 params это Promise
export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true },
  });

  if (!product) {
    notFound();
  }

  return (
    <div className="container py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Левая колонка: Изображение */}
        <div className="relative aspect-square bg-secondary/20 rounded-xl overflow-hidden border">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Нет изображения
            </div>
          )}
        </div>

        {/* Правая колонка: Информация */}
        <div className="flex flex-col gap-6">
          <div>
            {product.category && (
              <Badge variant="secondary" className="mb-3">
                {product.category.name}
              </Badge>
            )}
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{product.name}</h1>
            <p className="text-2xl font-semibold text-primary">
              {formatPrice(product.priceRub)}
              <span className="text-base text-muted-foreground font-normal ml-1">
                 / {product.unit === 'kg' ? '1 кг' : '1 шт'}
              </span>
            </p>
          </div>

          <div className="prose text-muted-foreground">
            {product.description || "Описание отсутствует."}
          </div>

          <div className="mt-auto pt-6 border-t">
             {/* Клиентский компонент с кнопкой */}
            <ProductActions product={product} />
          </div>
        </div>
      </div>
    </div>
  );
}