'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { createProductGroup, updateProductGroup } from './actions';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ProductOption {
  id: string;
  name: string;
  category: { name: string } | null;
}

interface GroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupToEdit?: any; // Если null - создание, иначе редактирование
  allProducts: ProductOption[]; // Список всех товаров для выбора
}

export function GroupDialog({ open, onOpenChange, groupToEdit, allProducts }: GroupDialogProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [basePercent, setBasePercent] = useState('0');
  const [useInConstructor, setUseInConstructor] = useState(true);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());

  // Заполняем форму при открытии (если редактирование)
  useEffect(() => {
    if (open) {
      if (groupToEdit) {
        setName(groupToEdit.name);
        setBasePercent(groupToEdit.basePercent.toString());
        setUseInConstructor(groupToEdit.useInConstructor);
        // Собираем ID товаров, которые уже в группе
        const ids = new Set<string>(groupToEdit.products.map((p: any) => p.productId));
        setSelectedProductIds(ids);
      } else {
        // Сброс для создания
        setName('');
        setBasePercent('20');
        setUseInConstructor(true);
        setSelectedProductIds(new Set());
      }
    }
  }, [open, groupToEdit]);

  const toggleProduct = (id: string) => {
    const next = new Set(selectedProductIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedProductIds(next);
  };

  const handleSelectAll = () => {
      if (selectedProductIds.size === allProducts.length) {
          setSelectedProductIds(new Set());
      } else {
          setSelectedProductIds(new Set(allProducts.map(p => p.id)));
      }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      name,
      basePercent: parseFloat(basePercent) || 0,
      useInConstructor,
      productIds: Array.from(selectedProductIds),
    };

    let res;
    if (groupToEdit) {
      res = await updateProductGroup(groupToEdit.id, payload);
    } else {
      res = await createProductGroup(payload);
    }

    setLoading(false);

    if (res.success) {
      toast.success(groupToEdit ? 'Группа обновлена' : 'Группа создана');
      onOpenChange(false);
    } else {
      toast.error(res.error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{groupToEdit ? 'Редактировать группу' : 'Новая группа'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 flex-1 overflow-y-auto pr-2">
          {/* Основные настройки */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Название группы</Label>
              <Input
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Например: Твердые сыры"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="percent">Базовый процент (%)</Label>
              <Input
                id="percent"
                type="number"
                min="0"
                max="100"
                required
                value={basePercent}
                onChange={(e) => setBasePercent(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="active"
              checked={useInConstructor}
              onCheckedChange={(c) => setUseInConstructor(!!c)}
            />
            <Label htmlFor="active">Использовать в конструкторе</Label>
          </div>

          {/* Выбор товаров */}
          <div className="space-y-2 border-t pt-4">
            <div className="flex justify-between items-center mb-2">
                <Label>Товары в этой группе ({selectedProductIds.size})</Label>
                <Button type="button" variant="ghost" size="sm" onClick={handleSelectAll}>
                    {selectedProductIds.size === allProducts.length ? 'Снять все' : 'Выбрать все'}
                </Button>
            </div>

            <div className="border rounded-md h-60 overflow-y-auto p-2 bg-secondary/10 space-y-1">
              {allProducts.length === 0 && (
                  <div className="text-center text-sm text-muted-foreground py-10">Нет активных товаров</div>
              )}

              {allProducts.map((product) => (
                <div key={product.id} className="flex items-center space-x-3 p-2 hover:bg-white rounded-md transition-colors">
                  <Checkbox
                    id={`prod-${product.id}`}
                    checked={selectedProductIds.has(product.id)}
                    onCheckedChange={() => toggleProduct(product.id)}
                  />
                  <label
                    htmlFor={`prod-${product.id}`}
                    className="text-sm cursor-pointer flex-1 flex justify-between"
                  >
                    <span>{product.name}</span>
                    <span className="text-muted-foreground text-xs">{product.category?.name}</span>
                  </label>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Выберите товары, которые алгоритм может предлагать в рамках этой группы (например, все твердые сыры).
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Сохранить
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}