import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CategoryDialog } from "./category-dialog"; // Создадим ниже
import { Edit, Trash2, Check, X } from "lucide-react";
import { deleteCategory } from "./actions";

export default async function AdminCategoriesPage() {
  const categories = await db.category.findMany({
    orderBy: { displayOrder: 'asc' },
    include: { _count: { select: { products: true } } }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Категории</h1>
        <CategoryDialog />
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Сорт.</TableHead>
              <TableHead>Название</TableHead>
              <TableHead>Для тарелки (Плесень)?</TableHead>
              <TableHead>Активность</TableHead>
              <TableHead>Товаров</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell>{cat.displayOrder}</TableCell>
                <TableCell className="font-medium">{cat.name}</TableCell>
                <TableCell>
                  {cat.isMold ? <span className="text-purple-600 font-bold">Да (Плесень)</span> : "Нет"}
                </TableCell>
                <TableCell>
                  {cat.isActive ? <Check className="text-green-500 h-5 w-5"/> : <X className="text-red-500 h-5 w-5"/>}
                </TableCell>
                <TableCell>{cat._count.products}</TableCell>
                <TableCell className="text-right flex justify-end gap-2">
                  <CategoryDialog category={cat} />
                  <form action={deleteCategory.bind(null, cat.id)}>
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