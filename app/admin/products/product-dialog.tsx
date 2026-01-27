"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createProduct, updateProduct } from "./actions";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

// Добавляем проп product (опциональный)
export function ProductDialog({ categories, product }: { categories: any[], product?: any }) {
  const [open, setOpen] = useState(false);
  const isEdit = !!product; // Если товар передан, значит мы редактируем

  // Состояние для списка вариантов
  const [variants, setVariants] = useState<string[]>([]);

  // При изменении товара (или открытии) загружаем его варианты, если они есть
  useEffect(() => {
    if (product?.variants && Array.isArray(product.variants)) {
      setVariants(product.variants.map((v: any) => v.name));
    } else {
      setVariants([]);
    }
  }, [product]);

  // Хендлеры для управления списком вариантов
  const addVariant = () => setVariants([...variants, ""]);

  const updateVariant = (idx: number, val: string) => {
    const newV = [...variants];
    newV[idx] = val;
    setVariants(newV);
  };

  const removeVariant = (idx: number) => {
    setVariants(variants.filter((_, i) => i !== idx));
  };

  async function handleSubmit(formData: FormData) {
    let res;
    if (isEdit) {
      // Режим редактирования
      res = await updateProduct(product.id, null, formData);
    } else {
      // Режим создания
      res = await createProduct(null, formData);
    }

    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success(isEdit ? "Товар обновлен" : "Товар создан");
      setOpen(false);
      // Если создавали новый, очищаем форму вариантов
      if (!isEdit) setVariants([]);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
        ) : (
          <Button><Plus className="mr-2 h-4 w-4" /> Добавить товар</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Редактировать товар" : "Новый товар"}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="grid grid-cols-2 gap-4">

          <div className="col-span-2 space-y-2">
            <Label>Название</Label>
            <Input name="name" defaultValue={product?.name} required />
          </div>

          <div className="space-y-2">
            <Label>Категория</Label>
            <Select name="categoryId" defaultValue={product?.categoryId} required>
              <SelectTrigger>
                <SelectValue placeholder="Выберите категорию" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Цена (₽)</Label>
            <Input name="priceRub" type="number" defaultValue={product?.priceRub} required />
          </div>

          <div className="space-y-2">
            <Label>Единица</Label>
            <Select name="unit" defaultValue={product?.unit || "kg"}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="kg">За кг (kg)</SelectItem>
                <SelectItem value="pcs">За шт (pcs)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
             <Label>Остаток</Label>
             <Input name="remainder" type="number" defaultValue={product?.remainder || 0} />
          </div>

          <div className="space-y-2">
             <Label>Средний вес куска (гр)</Label>
             <Input name="avgPackWeightGrams" type="number" defaultValue={product?.avgPackWeightGrams || 200} />
             <p className="text-xs text-muted-foreground">Для калькулятора (если продаем на вес)</p>
          </div>

          <div className="col-span-2 space-y-2">
            <Label>Изображение</Label>
            {product?.imageUrl && (
                <div className="mb-2">
                    <img src={product.imageUrl} alt="Current" className="h-16 w-16 rounded object-cover border" />
                </div>
            )}
            <Input name="image" type="file" accept="image/*" />
          </div>

          {/* СЕКЦИЯ ВАРИАНТОВ */}
          <div className="col-span-2 space-y-3 border p-4 rounded-md bg-slate-50">
            <div className="flex items-center justify-between">
               <div className="space-y-1">
                   <Label>Варианты (Вкусы / Виды)</Label>
                   <p className="text-xs text-muted-foreground">Добавьте варианты, если товар имеет разновидности (цена будет общей).</p>
               </div>
               <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                 <Plus className="mr-2 h-3 w-3" /> Добавить
               </Button>
            </div>

            <div className="space-y-2">
              {variants.length === 0 && (
                  <div className="text-sm text-muted-foreground italic text-center py-2 border border-dashed rounded bg-white/50">
                      Нет вариантов (товар стандартный)
                  </div>
              )}

              {variants.map((variant, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    name="variants" // Важно: этот name используется в actions.ts
                    value={variant}
                    onChange={(e) => updateVariant(index, e.target.value)}
                    placeholder="Например: С паприкой"
                    className="bg-white"
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeVariant(index)} className="hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-2 space-y-2">
            <Label>Описание</Label>
            <Textarea name="description" defaultValue={product?.description || ""} />
          </div>

          <div className="col-span-2 flex items-center gap-2">
             <Checkbox name="isActive" defaultChecked={product?.isActive ?? true} id="isActiveProduct" />
             <Label htmlFor="isActiveProduct">Товар активен</Label>
          </div>

          <div className="col-span-2">
            <Button type="submit" className="w-full">Сохранить</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}