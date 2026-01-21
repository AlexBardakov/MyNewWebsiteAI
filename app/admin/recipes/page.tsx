import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RecipeDialog } from "./recipe-dialog";
import { Trash2 } from "lucide-react";
import { deleteRecipe } from "./actions";
import Image from "next/image";

export default async function AdminRecipesPage() {
  const recipes = await db.recipe.findMany({
    include: { category: true, recipeProducts: true },
    orderBy: { createdAt: 'desc' },
  });

  const categories = await db.recipeCategory.findMany({ orderBy: { displayOrder: 'asc' }});
  const products = await db.product.findMany({ where: { isActive: true }, select: { id: true, name: true } });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Рецепты</h1>
        <RecipeDialog categories={categories} products={products} />
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Фото</TableHead>
              <TableHead>Название</TableHead>
              <TableHead>Категория</TableHead>
              <TableHead>Товаров</TableHead>
              <TableHead>Активен</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recipes.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  {r.coverUrl && (
                    <Image src={r.coverUrl} alt={r.title} width={40} height={40} className="rounded object-cover" />
                  )}
                </TableCell>
                <TableCell className="font-medium">{r.title}</TableCell>
                <TableCell>{r.category?.name || "—"}</TableCell>
                <TableCell>{r.recipeProducts.length}</TableCell>
                <TableCell>{r.isActive ? "✅" : "❌"}</TableCell>
                <TableCell className="text-right flex justify-end gap-2">
                   {/* Редактирование добавим позже по аналогии с товарами */}
                  <form action={deleteRecipe.bind(null, r.id)}>
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