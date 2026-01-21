"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createRecipe } from "./actions";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export function RecipeDialog({ categories, products }: { categories: any[], products: any[] }) {
  const [open, setOpen] = useState(false);

  async function handleSubmit(formData: FormData) {
    const res = await createRecipe(null, formData);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Рецепт создан");
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="mr-2 h-4 w-4" /> Добавить рецепт</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Новый рецепт</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="grid grid-cols-2 gap-6">

          <div className="col-span-2 space-y-2">
            <Label>Название рецепта</Label>
            <Input name="title" required />
          </div>

          <div className="space-y-2">
            <Label>Категория</Label>
            <Select name="categoryId">
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

           <div className="space-y-2">
            <Label>Обложка</Label>
            <Input name="image" type="file" accept="image/*" />
          </div>

          <div className="col-span-2 space-y-2">
            <Label>Краткое описание / Ингредиенты (текст)</Label>
            <Textarea name="ingredientsText" placeholder="Список ингредиентов..." />
          </div>

          <div className="col-span-2 space-y-2">
            <Label>Полное описание (способ приготовления)</Label>
            <Textarea name="content" className="min-h-[150px]" required />
          </div>

          {/* Выбор товаров */}
          <div className="col-span-2 border rounded-md p-4 bg-gray-50">
             <Label className="mb-2 block font-bold">Связанные товары (для покупки)</Label>
             <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
                {products.map(p => (
                   <div key={p.id} className="flex items-center space-x-2">
                      <Checkbox id={`prod-${p.id}`} name="productIds" value={p.id} />
                      <Label htmlFor={`prod-${p.id}`} className="font-normal cursor-pointer">{p.name}</Label>
                   </div>
                ))}
             </div>
          </div>

          <div className="col-span-2 flex items-center gap-2">
             <Checkbox name="isActive" defaultChecked id="isActiveRecipe" />
             <Label htmlFor="isActiveRecipe">Рецепт активен</Label>
          </div>

          <div className="col-span-2">
            <Button type="submit" className="w-full">Сохранить</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}