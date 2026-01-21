"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { createCategory, updateCategory } from "./actions";
import { Edit, Plus } from "lucide-react";
import { toast } from "sonner";

export function CategoryDialog({ category }: { category?: any }) {
  const [open, setOpen] = useState(false);
  const isEdit = !!category;

  async function handleSubmit(formData: FormData) {
    let res;
    if (isEdit) {
        // При редактировании вызываем update
       res = await updateCategory(category.id, null, formData);
    } else {
       res = await createCategory(null, formData);
    }

    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success(isEdit ? "Категория обновлена" : "Категория создана");
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
        ) : (
          <Button><Plus className="mr-2 h-4 w-4" /> Добавить категорию</Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Редактировать категорию" : "Новая категория"}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Название</Label>
            <Input name="name" defaultValue={category?.name} required />
          </div>

          <div className="space-y-2">
            <Label>Порядок сортировки</Label>
            <Input name="displayOrder" type="number" defaultValue={category?.displayOrder || 0} />
          </div>

          <div className="flex items-center gap-2">
             <Checkbox name="isMold" defaultChecked={category?.isMold} id="isMold" />
             <Label htmlFor="isMold">Это сыр с плесенью (для калькулятора)</Label>
          </div>

          <div className="flex items-center gap-2">
             <Checkbox name="isActive" defaultChecked={category?.isActive ?? true} id="isActive" />
             <Label htmlFor="isActive">Активна (показывать на сайте)</Label>
          </div>

          <Button type="submit" className="w-full">Сохранить</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}