"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createRecipe, updateRecipe } from "./actions";
import { Plus, Pencil } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface RecipeData {
    id: string;
    title: string;
    content: string | null;
    ingredientsText: string | null;
    categoryId: string | null;
    isActive: boolean;
    coverUrl: string | null;
    recipeProducts: { productId: string }[];
}

interface RecipeDialogProps {
    categories: any[];
    products: any[];
    recipe?: RecipeData; // Если передан, то режим редактирования
}

export function RecipeDialog({ categories, products, recipe }: RecipeDialogProps) {
  const [open, setOpen] = useState(false);

  // Список выбранных товаров для чекбоксов
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  useEffect(() => {
      if (recipe && open) {
          setSelectedProducts(recipe.recipeProducts.map(rp => rp.productId));
      } else if (!recipe && open) {
          setSelectedProducts([]);
      }
  }, [recipe, open]);

  const handleProductToggle = (pId: string) => {
      setSelectedProducts(prev =>
        prev.includes(pId) ? prev.filter(id => id !== pId) : [...prev, pId]
      );
  };

  async function handleSubmit(formData: FormData) {
    let res;
    if (recipe) {
        // Режим редактирования
        res = await updateRecipe(recipe.id, null, formData);
    } else {
        // Режим создания
        res = await createRecipe(null, formData);
    }

    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success(recipe ? "Рецепт обновлен" : "Рецепт создан");
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {recipe ? (
            <Button variant="ghost" size="icon" className="hover:bg-blue-50 text-blue-600">
                <Pencil className="h-4 w-4" />
            </Button>
        ) : (
            <Button><Plus className="mr-2 h-4 w-4" /> Добавить рецепт</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{recipe ? "Редактирование рецепта" : "Новый рецепт"}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="grid grid-cols-2 gap-6">

          {/* Название */}
          <div className="col-span-2 space-y-2">
            <Label>Название рецепта</Label>
            <Input name="title" required defaultValue={recipe?.title} />
          </div>

          {/* Категория */}
          <div className="space-y-2">
            <Label>Категория</Label>
            <Select name="categoryId" defaultValue={recipe?.categoryId || ""}>
              <SelectTrigger>
                <SelectValue placeholder="Без категории" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Фото */}
           <div className="space-y-2">
            <Label>Обложка {recipe?.coverUrl && "(загрузите, чтобы заменить)"}</Label>
            <div className="flex gap-4 items-center">
                {recipe?.coverUrl && (
                    <div className="relative w-10 h-10 rounded overflow-hidden border">
                         <Image src={recipe.coverUrl} alt="Cover" fill className="object-cover" />
                    </div>
                )}
                <Input name="image" type="file" accept="image/*" className="flex-1" />
            </div>
          </div>

          {/* Ингредиенты */}
          <div className="col-span-2 space-y-2">
            <Label>Краткое описание / Ингредиенты</Label>
            <Textarea
                name="ingredientsText"
                placeholder="Список ингредиентов..."
                defaultValue={recipe?.ingredientsText || ""}
            />
          </div>

          {/* Полное описание */}
          <div className="col-span-2 space-y-2">
            <Label>Способ приготовления</Label>
            <Textarea
                name="content"
                className="min-h-[150px]"
                required
                defaultValue={recipe?.content || ""}
            />
          </div>

          {/* Выбор товаров */}
          <div className="col-span-2 border rounded-md p-4 bg-gray-50">
             <Label className="mb-2 block font-bold">Связанные товары (для покупки)</Label>
             <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
                {products.map(p => (
                   <div key={p.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`prod-${p.id}`}
                        name="productIds"
                        value={p.id}
                        checked={selectedProducts.includes(p.id)}
                        onCheckedChange={() => handleProductToggle(p.id)}
                      />
                      <Label htmlFor={`prod-${p.id}`} className="font-normal cursor-pointer text-sm">
                        {p.name}
                      </Label>
                   </div>
                ))}
             </div>
          </div>

          {/* Активность */}
          <div className="col-span-2 flex items-center gap-2">
             <Checkbox
                name="isActive"
                id="isActiveRecipe"
                defaultChecked={recipe ? recipe.isActive : true}
             />
             <Label htmlFor="isActiveRecipe">Рецепт активен</Label>
          </div>

          <div className="col-span-2 pt-4">
            <Button type="submit" className="w-full">{recipe ? "Обновить" : "Сохранить"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}