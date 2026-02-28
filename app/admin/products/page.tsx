// app/admin/products/page.tsx
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
import { deleteProduct } from "./actions";
import { Trash2 } from "lucide-react";
import { SearchInput } from "./search-input";
import { QuantityInput } from "./quantity-input";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage(props: {
  searchParams: Promise<{ q?: string }>;
}) {
  // Дожидаемся параметров поиска (обязательно для Next.js 15+)
  const searchParams = await props.searchParams;
  const q = searchParams?.q || "";

  // Получаем категории в правильном порядке
  const categories = await db.category.findMany({
    orderBy: { displayOrder: "asc" },
  });

  // Получаем ВСЕ товары из базы данных (без where)
  const allProducts = await db.product.findMany({
    orderBy: [
      { displayOrder: "asc" },
      { createdAt: "desc" }
    ],
    include: {
      category: true,
      variants: true,
    },
  });

  // Фильтруем товары средствами JavaScript (нечувствительно к регистру кириллицы)
  const lowerQ = q.toLowerCase();
  const products = allProducts.filter((p) =>
    p.name.toLowerCase().includes(lowerQ)
  );

  // Группируем отфильтрованные товары по категориям
  const groupedProducts = categories
    .map((category) => ({
      category,
      products: products.filter((p) => p.categoryId === category.id),
    }))
    // Отфильтровываем категории, в которых нет товаров (особенно актуально при поиске)
    .filter((group) => group.products.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Товары</h1>
        <ProductDialog categories={categories} />
      </div>

      <SearchInput />

      <div className="space-y-8">
        {groupedProducts.length === 0 ? (
          <div className="text-center text-muted-foreground py-10 border rounded-md">
            По вашему запросу ничего не найдено.
          </div>
        ) : (
          groupedProducts.map((group) => (
            <div key={group.category.id} className="space-y-3">
              <h2 className="text-xl font-semibold pl-1 text-primary">
                {group.category.name}
              </h2>
              <div className="rounded-md border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Фото</TableHead>
                      <TableHead>Название</TableHead>
                      <TableHead className="w-32">Цена</TableHead>
                      <TableHead className="w-40">Остаток</TableHead>
                      <TableHead className="w-24">Статус</TableHead>
                      <TableHead className="text-right w-24">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.products.map((product) => (
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
                          {product.variants.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {product.variants.map((v) => (
                                <span
                                  key={v.id}
                                  className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground"
                                >
                                  {v.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{product.priceRub} ₽</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {/* Инлайн-поле для изменения остатка */}
                            <QuantityInput
                              productId={product.id}
                              initialQuantity={product.remainder}
                            />
                            <span className="text-sm text-muted-foreground">
                              {product.unit}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {product.isActive ? (
                            <Badge
                              variant="default"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Активен
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Скрыт</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <ProductDialog categories={categories} product={product} />

                          <form
                            action={deleteProduct.bind(null, product.id)}
                            className="inline-block"
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="hover:text-red-600"
                            >
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
          ))
        )}
      </div>
    </div>
  );
}