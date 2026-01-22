'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useCart } from '@/store/cart'; // Убедись, что путь к стору верный
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Loader2, Plus, RefreshCw, Trash2, Repeat } from 'lucide-react';

// --- Типы ---
export type Product = {
  id: string;
  name: string;
  categoryId: string;
  imageUrl?: string | null;
  priceRub: number;
  unit: string;
  remainder: number;
  avgPackWeightGrams?: number | null;
  isActive?: boolean;
};

export type Category = {
  id: string;
  name: string;
  isActive?: boolean;
  isMold?: boolean;
};

export type ProductGroup = {
  id: string;
  name: string;
  useInConstructor: boolean;
  basePercent: number;
  productIds: string[];
};

type CheesePlateItem = {
  id: string;
  name: string;
  imageUrl?: string | null;
  unit: string;
  priceRub: number;
  approxPiecePriceRub?: number;
  categoryId?: string;
  categoryName?: string;
};

type CheesePlate = {
  products: CheesePlateItem[];
  approxTotalRub: number;
};

type BuildPayload = {
  ok: boolean;
  plate?: CheesePlate;
  error?: string;
};

type SuggestionsPayload = {
  ok: boolean;
  suggestions?: CheesePlate[];
};

// --- Утилиты ---
function formatPrice(rub: number | undefined | null): string {
  const n = Math.max(0, Math.round(rub || 0));
  return n.toLocaleString('ru-RU');
}

function formatPortionLabel(prod?: Product): string {
  if (!prod) return '';
  if (prod.unit === 'pcs') return '1 шт.';
  const grams = prod.avgPackWeightGrams && prod.avgPackWeightGrams > 0 ? prod.avgPackWeightGrams : 200;
  return `≈ ${grams} г`;
}

function normalizeCheesePlate(raw: any): CheesePlate {
  const products: CheesePlateItem[] = Array.isArray(raw?.products)
    ? raw.products.map((it: any) => ({
        id: it.id,
        name: it.name,
        imageUrl: it.imageUrl ?? null,
        unit: it.unit,
        priceRub: it.priceRub,
        approxPiecePriceRub: it.approxPiecePriceRub,
        categoryId: it.categoryId,
        categoryName: it.categoryName,
      }))
    : [];

  const approxTotalRub = typeof raw?.approxTotalRub === 'number'
      ? raw.approxTotalRub
      : products.reduce((sum, it) => sum + (typeof it.approxPiecePriceRub === 'number' ? it.approxPiecePriceRub : it.priceRub || 0), 0);

  return { products, approxTotalRub };
}

function applyMoldFilterToPlate(plate: CheesePlate, excludeMold: boolean, moldProductIds: Set<string>): CheesePlate {
  if (!excludeMold || moldProductIds.size === 0) return plate;
  const filteredProducts = plate.products.filter((p) => !moldProductIds.has(p.id));
  const approxTotalRub = filteredProducts.reduce(
    (sum, it) => sum + (typeof it.approxPiecePriceRub === 'number' ? it.approxPiecePriceRub : it.priceRub || 0), 0
  );
  return { ...plate, products: filteredProducts, approxTotalRub };
}

// --- Компонент ---
interface Props {
  initialProducts: Product[];
  initialCategories: Category[];
  initialGroups: ProductGroup[];
  initialSuggestions: CheesePlate[];
}

export default function CheesePlateClient({ initialProducts, initialCategories, initialGroups, initialSuggestions }: Props) {
  const addItem = useCart((state) => state.addItem);

  const [products] = useState<Product[]>(initialProducts);
  const [categories] = useState<Category[]>(initialCategories);
  const [groups] = useState<ProductGroup[]>(initialGroups);

  const [suggestions, setSuggestions] = useState<CheesePlate[]>(initialSuggestions);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  const [favoriteCategoryId, setFavoriteCategoryId] = useState<string>('');
  const [excludeMold, setExcludeMold] = useState(false);
  const [cheeseCount, setCheeseCount] = useState<string>('');
  const [targetPriceRub, setTargetPriceRub] = useState<string>('');

  const [building, setBuilding] = useState(false);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [currentPlate, setCurrentPlate] = useState<CheesePlate | null>(null);
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);

  // Карта продуктов
  const productMap = useMemo(() => {
    const m = new Map<string, Product>();
    products.forEach((p) => m.set(p.id, p));
    return m;
  }, [products]);

  // Продукты с плесенью
  const moldProductIds = useMemo(() => {
    if (!categories.length || !products.length) return new Set<string>();
    const moldCategoryIds = new Set<string>();
    categories.forEach((c) => { if (c.isMold) moldCategoryIds.add(c.id); });
    const ids = new Set<string>();
    products.forEach((p) => { if (moldCategoryIds.has(p.categoryId)) ids.add(p.id); });
    return ids;
  }, [categories, products]);

  // Доступные категории
  const favoriteCategories = useMemo(() => {
    if (!products.length || !groups.length || !categories.length) return [];
    const allowedProductIds = new Set<string>();
    groups.forEach((g) => g.productIds.forEach((id) => allowedProductIds.add(id)));
    const allowedCategoryIds = new Set<string>();
    products.forEach((p) => { if (allowedProductIds.has(p.id)) allowedCategoryIds.add(p.categoryId); });
    return categories.filter((c) => allowedCategoryIds.has(c.id) && c.isActive !== false)
      .sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  }, [products, groups, categories]);

  // Обновить предложения
  async function reloadSuggestions() {
    try {
      setSuggestionsLoading(true);
      const res = await fetch('/api/cheese-plates/suggestions');
      if (!res.ok) throw new Error();
      const suggJson: SuggestionsPayload = await res.json();
      const sugg = Array.isArray(suggJson?.suggestions) ? suggJson.suggestions.map(normalizeCheesePlate) : [];
      setSuggestions(sugg);
    } catch {
      toast.error('Не удалось обновить варианты.');
    } finally {
      setSuggestionsLoading(false);
    }
  }

  // Собрать тарелку
  async function handleBuild(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setBuildError(null);
    setBuilding(true);
    setCurrentPlate(null);

    try {
      const body: any = { excludeMold: !!excludeMold };
      if (favoriteCategoryId) body.favoriteCategoryId = favoriteCategoryId;
      if (cheeseCount.trim()) body.cheeseCount = Number(cheeseCount);
      if (targetPriceRub.trim()) body.targetPriceRub = Number(targetPriceRub);

      const res = await fetch('/api/cheese-plates/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json: BuildPayload = await res.json();

      if (!res.ok || !json.ok || !json.plate) {
        setBuildError(json.error || 'Не удалось собрать тарелку');
        return;
      }

      setCurrentPlate(applyMoldFilterToPlate(normalizeCheesePlate(json.plate), excludeMold, moldProductIds));
    } catch {
      setBuildError('Ошибка соединения. Попробуйте еще раз.');
    } finally {
      setBuilding(false);
    }
  }

  // Действия с тарелкой
  function removeFromCurrent(id: string) {
    setCurrentPlate((prev) => {
      if (!prev) return prev;
      const products = prev.products.filter((p) => p.id !== id);
      const approxTotalRub = products.reduce((sum, it) => sum + (it.approxPiecePriceRub || it.priceRub || 0), 0);
      return { ...prev, products, approxTotalRub };
    });
  }

  async function replaceInCurrent(index: number) {
    if (!currentPlate) return;
    setReplaceIndex(index);
    try {
        // Логика замены (аналогично handleBuild, но без полного сброса)
         const body: any = { excludeMold: !!excludeMold };
         if (favoriteCategoryId) body.favoriteCategoryId = favoriteCategoryId;
         if (cheeseCount.trim()) body.cheeseCount = Number(cheeseCount);
         if (targetPriceRub.trim()) body.targetPriceRub = Number(targetPriceRub);

         const res = await fetch('/api/cheese-plates/build', {
            method: 'POST',
            body: JSON.stringify(body),
         });
         const json = await res.json();
         if(json.plate) {
             const newPlate = applyMoldFilterToPlate(normalizeCheesePlate(json.plate), excludeMold, moldProductIds);
             const currentIds = new Set(currentPlate.products.map(p => p.id));
             // Ищем кандидата, которого еще нет
             const candidate = newPlate.products.find(p => !currentIds.has(p.id)) || newPlate.products[0];

             if(candidate) {
                setCurrentPlate(prev => {
                    if(!prev) return prev;
                    const next = [...prev.products];
                    next[index] = candidate;
                    const total = next.reduce((acc, it) => acc + (it.approxPiecePriceRub || it.priceRub || 0), 0);
                    return { ...prev, products: next, approxTotalRub: total };
                })
             } else {
                 toast.info("Не удалось найти замену с такими параметрами");
             }
         }
    } catch {
        toast.error("Ошибка при замене");
    } finally {
        setReplaceIndex(null);
    }
  }

  function addPlateToCart(plate: CheesePlate) {
    if (!plate.products.length) return;
    let addedCount = 0;

    plate.products.forEach((it) => {
      const full = productMap.get(it.id);
      if (!full || full.remainder <= 0) return;
      const step = full.unit === 'kg' ? (full.avgPackWeightGrams || 100) : 1;
      addItem({
        id: full.id,
        name: full.name,
        priceRub: full.priceRub,
        quantity: step,
        unit: full.unit,
        image: full.imageUrl || undefined,
        step: step
      });
      addedCount++;
    });

    if (addedCount > 0) toast.success(`Добавлено позиций: ${addedCount}`);
    else toast.error('Товары из тарелки временно недоступны');
  }

  return (
    <div className="space-y-12">
      {/* Шапка */}
      <section className="bg-card rounded-3xl border border-secondary p-8 shadow-sm">
        <div className="flex flex-col md:flex-row gap-6 md:items-start justify-between">
            <div className="max-w-2xl">
                <h1 className="text-3xl font-bold mb-4 text-primary">Конструктор сырной тарелки</h1>
                <p className="text-muted-foreground">
                Расскажите о своих вкусах, и мы подберем идеальное сочетание сыров.
                Вы можете использовать готовые варианты или настроить состав под свой бюджет.
                </p>
            </div>
            <div className="bg-secondary/30 p-4 rounded-xl text-sm space-y-2 text-muted-foreground border border-secondary">
                <p>• Рекомендуем 4–5 видов сыра</p>
                <p>• Только сыры в наличии</p>
                <p>• Цены примерные (за кусочек)</p>
            </div>
        </div>
      </section>

      {/* Готовые варианты */}
      <section>
        <div className="flex flex-col sm:flex-row items-baseline justify-between mb-6 gap-4">
            <div>
                <h2 className="text-2xl font-bold">Готовые варианты</h2>
                <p className="text-muted-foreground">Вдохновение от наших сырных сомелье</p>
            </div>
            <Button variant="outline" onClick={reloadSuggestions} disabled={suggestionsLoading} className="gap-2">
                <RefreshCw className={cn("w-4 h-4", suggestionsLoading && "animate-spin")} />
                Обновить варианты
            </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
            {suggestions.map((plate, idx) => (
                <div key={idx} className="bg-white rounded-2xl border p-5 flex flex-col gap-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                    <div className="flex justify-between items-center pb-3 border-b border-dashed">
                        <span className="font-semibold text-lg">Вариант №{idx + 1}</span>
                        <Badge variant="secondary" className="bg-secondary text-secondary-foreground text-sm px-2 py-0.5">
                           ≈ {formatPrice(plate.approxTotalRub)} ₽
                        </Badge>
                    </div>
                    <ul className="space-y-3 flex-1">
                        {plate.products.map(p => (
                            <li key={p.id} className="flex gap-3 text-sm">
                                <div className="w-10 h-10 rounded-lg bg-secondary/30 relative overflow-hidden flex-shrink-0">
                                    {p.imageUrl && <Image src={p.imageUrl} alt={p.name} fill className="object-cover" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate">{p.name}</div>
                                    <div className="text-muted-foreground text-xs flex justify-between">
                                        <span>{p.categoryName}</span>
                                        <span>{formatPrice(p.approxPiecePriceRub || p.priceRub)} ₽</span>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                    <Button className="w-full mt-2" onClick={() => addPlateToCart(plate)}>
                        <Plus className="w-4 h-4 mr-2" />
                        В корзину
                    </Button>
                </div>
            ))}
        </div>
      </section>

      {/* Конструктор */}
      <section className="grid lg:grid-cols-12 gap-8 items-start">
         {/* Форма */}
         <div className="lg:col-span-5 bg-card rounded-3xl border border-secondary p-6 shadow-sm space-y-6">
            <div>
                <h2 className="text-xl font-bold mb-1">Свой вариант</h2>
                <p className="text-sm text-muted-foreground">Укажите параметры, и алгоритм подберет сыры</p>
            </div>

            <form onSubmit={handleBuild} className="space-y-5">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Любимая категория</label>
                    <Select value={favoriteCategoryId} onValueChange={setFavoriteCategoryId}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Не выбрано (любая)" />
                        </SelectTrigger>
                        <SelectContent>
                             <SelectItem value="all">Не важно</SelectItem>
                             {favoriteCategories.map(c => (
                                 <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                             ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center space-x-3 bg-secondary/20 p-3 rounded-xl border border-secondary">
                    <Checkbox id="mold" checked={excludeMold} onCheckedChange={(c) => setExcludeMold(!!c)} />
                    <label htmlFor="mold" className="text-sm font-medium cursor-pointer flex-1">
                        Без сыров с плесенью
                    </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <label className="text-sm font-medium">Кол-во сыров</label>
                        <Input
                            type="number" min={3} max={7} placeholder="3-7"
                            value={cheeseCount} onChange={e => setCheeseCount(e.target.value)}
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-sm font-medium">Бюджет, ₽</label>
                        <Input
                            type="number" min={0} placeholder="~2000"
                            value={targetPriceRub} onChange={e => setTargetPriceRub(e.target.value)}
                        />
                     </div>
                </div>

                {buildError && <div className="text-destructive text-sm bg-destructive/10 p-3 rounded-lg">{buildError}</div>}

                <Button type="submit" size="lg" className="w-full font-semibold" disabled={building}>
                    {building && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {currentPlate ? 'Пересобрать' : 'Собрать тарелку'}
                </Button>
            </form>
         </div>

         {/* Результат */}
         <div className="lg:col-span-7 bg-card rounded-3xl border border-dashed border-secondary p-6 min-h-[400px] flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Ваша подборка</h2>
                {currentPlate && (
                    <Badge variant="secondary" className="text-base px-3 py-1">
                        Итого: ≈ {formatPrice(currentPlate.approxTotalRub)} ₽
                    </Badge>
                )}
            </div>

            {!currentPlate && (
                 <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground p-8">
                     <div className="w-16 h-16 bg-secondary/40 rounded-full flex items-center justify-center mb-4">
                        <Plus className="w-8 h-8 opacity-50" />
                     </div>
                     <p>Заполните форму слева и нажмите «Собрать тарелку»,<br/>чтобы увидеть магию ✨</p>
                 </div>
            )}

            {currentPlate && (
                <div className="space-y-4 flex-1">
                    {currentPlate.products.map((p, idx) => (
                        <div key={p.id} className="flex gap-4 items-center bg-white border rounded-xl p-3 shadow-sm">
                             <div className="w-16 h-16 bg-secondary/20 rounded-lg relative overflow-hidden flex-shrink-0">
                                 {p.imageUrl && <Image src={p.imageUrl} alt={p.name} fill className="object-cover" />}
                             </div>
                             <div className="flex-1 min-w-0">
                                 <h4 className="font-bold truncate">{p.name}</h4>
                                 <p className="text-sm text-muted-foreground">{p.categoryName}</p>
                                 <div className="text-sm font-medium mt-1">
                                     {formatPortionLabel(productMap.get(p.id))} · {formatPrice(p.approxPiecePriceRub || p.priceRub)} ₽
                                 </div>
                             </div>
                             <div className="flex flex-col gap-2">
                                 <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => replaceInCurrent(idx)} disabled={replaceIndex === idx} title="Заменить">
                                     {replaceIndex === idx ? <Loader2 className="w-3 h-3 animate-spin"/> : <RefreshCw className="w-3 h-3" />}
                                 </Button>
                                 <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeFromCurrent(p.id)} title="Удалить">
                                     <Trash2 className="w-4 h-4" />
                                 </Button>
                             </div>
                        </div>
                    ))}

                    {currentPlate.products.length > 0 && (
                        <div className="pt-4 mt-auto">
                            <Button size="lg" className="w-full text-lg h-12 shadow-lg shadow-primary/20" onClick={() => currentPlate && addPlateToCart(currentPlate)}>
                                Добавить всё в корзину
                            </Button>
                        </div>
                    )}
                </div>
            )}
         </div>
      </section>
    </div>
  );
}