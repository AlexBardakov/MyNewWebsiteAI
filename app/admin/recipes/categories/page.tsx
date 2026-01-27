import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createRecipeCategory, deleteRecipeCategory } from "./actions";

export default async function RecipeCategoriesPage() {
  const categories = await db.recipeCategory.findMany({
    orderBy: { displayOrder: 'asc' },
    include: { _count: { select: { recipes: true } } }
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/recipes">
           <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h1 className="text-3xl font-bold">Категории рецептов</h1>
      </div>

      {/* Форма добавления */}
      <div className="p-4 border rounded-lg bg-white shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Новая категория</h3>
        <form action={createRecipeCategory} className="flex gap-4 items-end">
          <div className="space-y-2 flex-1">
            <Label>Название</Label>
            <Input name="name" required placeholder="Например: Закуски" />
          </div>
          <div className="space-y-2 w-32">
            <Label>Порядок</Label>
            <Input name="displayOrder" type="number" defaultValue="0" />
          </div>
          <Button type="submit">Добавить</Button>
        </form>
      </div>

      {/* Список */}
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Порядок</TableHead>
              <TableHead>Название</TableHead>
              <TableHead>Рецептов внутри</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.displayOrder}</TableCell>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary-foreground">
                        {c._count.recipes}
                    </span>
                </TableCell>
                <TableCell className="text-right">
                  <form action={deleteRecipeCategory.bind(null, c.id)}>
                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </form>
                </TableCell>
              </TableRow>
            ))}
            {categories.length === 0 && (
                <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Категорий пока нет
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}