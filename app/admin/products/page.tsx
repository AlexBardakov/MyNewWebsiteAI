import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProductDialog } from "./product-dialog";
import { deleteProduct } from "./actions"; // Импортируем удаление
import Image from "next/image";
import { Trash2 } from "lucide-react";

export default async function AdminProductsPage() {
  const products = await db.product.findMany({
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  });

  const categories = await db.category.findMany({ orderBy: { name: 'asc' } });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Товары</h1>
        {/* Диалог создания (без пропса product) */}
        <ProductDialog categories={categories} />
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Фото</TableHead>
              <TableHead>Название</TableHead>
              <TableHead>Категория</TableHead>
              <TableHead>Цена</TableHead>
              <TableHead>Остаток</TableHead>
              <TableHead>Активен</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  {p.imageUrl && (
                    <Image src={p.imageUrl} alt={p.name} width={40} height={40} className="rounded object-cover" />
                  )}
                </TableCell>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>{p.category.name}</TableCell>
                <TableCell>{p.priceRub} ₽ / {p.unit}</TableCell>
                <TableCell>{p.remainder}</TableCell>
                <TableCell>{p.isActive ? "✅" : "❌"}</TableCell>
                <TableCell className="text-right flex justify-end gap-2">
                  {/* Кнопка Редактировать (передаем товар) */}
                  <ProductDialog categories={categories} product={p} />

                  {/* Кнопка Удалить */}
                  <form action={deleteProduct.bind(null, p.id)}>
                    <Button variant="ghost" size="icon" className="text-red-500">
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