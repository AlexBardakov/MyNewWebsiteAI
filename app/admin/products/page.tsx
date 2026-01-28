import { ProductDialog } from "./product-dialog";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { deleteProduct } from "./actions"; // Убедись, что импорт правильный (возможно нужен отдельный компонент для кнопки удаления)
import { Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  // ВАЖНО: Добавили include: { variants: true }
  const products = await db.product.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      category: true,
      variants: true, // <--- ВОТ ЭТОЙ СТРОЧКИ НЕ ХВАТАЛО
    },
  });

  const categories = await db.category.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Товары</h1>
        <ProductDialog categories={categories} />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Фото</TableHead>
              <TableHead>Название</TableHead>
              <TableHead>Категория</TableHead>
              <TableHead>Цена</TableHead>
              <TableHead>Остаток</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-10 w-10 rounded object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded bg-secondary/20" />
                  )}
                </TableCell>
                <TableCell className="font-medium">
                  {product.name}
                  {/* Можно показать бейджик, если есть варианты */}
                  {product.variants.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {product.variants.map((v) => (
                        <span key={v.id} className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">
                          {v.name}
                        </span>
                      ))}
                    </div>
                  )}
                </TableCell>
                <TableCell>{product.category.name}</TableCell>
                <TableCell>{product.priceRub} ₽</TableCell>
                <TableCell>
                  {product.remainder} {product.unit}
                </TableCell>
                <TableCell>
                  {product.isActive ? (
                    <Badge variant="default" className="bg-green-600 hover:bg-green-700">Активен</Badge>
                  ) : (
                    <Badge variant="secondary">Скрыт</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  {/* Передаем товар (вместе с загруженными вариантами) в диалог */}
                  <ProductDialog categories={categories} product={product} />

                  {/* Кнопка удаления (лучше вынести в отдельный клиентский компонент, но для простоты можно так) */}
                  <form action={deleteProduct.bind(null, product.id)} className="inline-block">
                     <Button variant="ghost" size="icon" className="hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                     </Button>
                  </form>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}