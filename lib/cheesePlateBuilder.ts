// lib/cheesePlateBuilder.ts
import prisma from './prisma';

export type CheesePlateItem = {
  id: string;
  name: string;
  imageUrl: string | null;
  unit: 'kg' | 'pcs';
  priceRub: number;
  approxPiecePriceRub: number;
  categoryId: string;
  categoryName: string;
};

export type CheesePlate = {
  products: CheesePlateItem[];
  approxTotalRub: number;
};

export type BuildCheesePlateOptions = {
  favoriteCategoryId?: string | null;
  excludeMold?: boolean;
  cheeseCount?: number | null;
  targetPriceRub?: number | null;
};

type InternalCandidate = {
  id: string;
  name: string;
  imageUrl: string | null;
  priceRub: number;
  unit: 'kg' | 'pcs';
  avgPackWeightGrams: number;
  remainder: number;
  categoryId: string;
  categoryName: string;
  isMoldCategory: boolean;
  approxPiecePriceRub: number;
};

type GroupWithCandidates = {
  id: string;
  name: string;
  basePercent: number;
  candidates: InternalCandidate[];
};

type ConstructorDataset = {
  groups: GroupWithCandidates[];
  allCandidates: InternalCandidate[];
  productsByCategory: Map<string, InternalCandidate[]>;
};

function clampCheeseCount(n?: number | null): number {
  if (typeof n === 'number' && !Number.isNaN(n)) {
    const val = Math.round(n);
    if (val < 3) return 3;
    if (val > 7) return 7;
    return val;
  }
  // дефолт — случайно 4 или 5
  return 4 + (Math.random() < 0.5 ? 0 : 1);
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

function computeApproxPiecePrice(p: {
  unit: string;
  priceRub: number;
  avgPackWeightGrams: number;
}): number {
  const price = p.priceRub || 0;
  if (p.unit === 'kg') {
    const weight = p.avgPackWeightGrams > 0 ? p.avgPackWeightGrams : 200; // грамм
    return Math.max(0, Math.round((price * weight) / 1000));
  }
  // pcs — цена за штуку
  return Math.max(0, price);
}

async function loadConstructorDataset(excludeMold: boolean): Promise<ConstructorDataset> {
  // Загружаем группы и связанные продукты
  const groupsRaw = await prisma.productGroup.findMany({
    where: { useInConstructor: true },
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    include: {
      products: {
        include: {
          product: {
            include: {
              category: true,
            },
          },
        },
      },
    },
  });

  const candidateById = new Map<string, InternalCandidate>();
  const groups: GroupWithCandidates[] = [];

  for (const g of groupsRaw) {
    const basePercent = Math.min(Math.max(g.basePercent || 0, 0), 100);
    const groupCandidates: InternalCandidate[] = [];

    for (const pg of g.products) {
      const p = pg.product as any;
      if (!p) continue;

      // фильтры по товару и категории
      if (!p.isActive) continue;
      if (!p.category || !p.category.isActive) continue;
      if (p.remainder <= 0) continue;
      if (excludeMold && p.category.isMold) continue;

      let candidate = candidateById.get(p.id);
      if (!candidate) {
        const avgPackWeightGrams =
          typeof p.avgPackWeightGrams === 'number' && p.avgPackWeightGrams > 0
            ? p.avgPackWeightGrams
            : 0;

        const approxPiecePriceRub = computeApproxPiecePrice({
          unit: p.unit,
          priceRub: p.priceRub,
          avgPackWeightGrams,
        });

        candidate = {
          id: p.id,
          name: p.name,
          imageUrl: p.imageUrl || null,
          priceRub: p.priceRub,
          unit: p.unit === 'kg' ? 'kg' : 'pcs',
          avgPackWeightGrams,
          remainder: p.remainder,
          categoryId: p.categoryId,
          categoryName: p.category.name,
          isMoldCategory: !!p.category.isMold,
          approxPiecePriceRub,
        };
        candidateById.set(p.id, candidate);
      }

      groupCandidates.push(candidate);
    }

    if (groupCandidates.length > 0) {
      groups.push({
        id: g.id,
        name: g.name,
        basePercent,
        candidates: groupCandidates,
      });
    }
  }

  const allCandidates = Array.from(candidateById.values());

  const productsByCategory = new Map<string, InternalCandidate[]>();
  for (const c of allCandidates) {
    const list = productsByCategory.get(c.categoryId);
    if (list) {
      list.push(c);
    } else {
      productsByCategory.set(c.categoryId, [c]);
    }
  }

  return { groups, allCandidates, productsByCategory };
}

type BuildRandomPlateOptions = {
  dataset: ConstructorDataset;
  cheeseCount: number;
  favoriteCategoryId?: string | null;
};

function buildRandomPlate(opts: BuildRandomPlateOptions): CheesePlate | null {
  const { dataset, favoriteCategoryId, cheeseCount } = opts;
  const { groups, allCandidates, productsByCategory } = dataset;

  if (!groups.length || !allCandidates.length) return null;

  const picked: InternalCandidate[] = [];
  const pickedIds = new Set<string>();

  // 1. Любимая категория
  if (favoriteCategoryId) {
    const favPoolRaw = productsByCategory.get(favoriteCategoryId) || [];
    const favPool = favPoolRaw.slice();
    if (favPool.length > 0) {
      const favTarget = Math.max(1, Math.min(cheeseCount, Math.round(cheeseCount * 0.6)));
      const shuffled = shuffle(favPool);
      const take = Math.min(favTarget, shuffled.length);
      for (let i = 0; i < take; i += 1) {
        const c = shuffled[i];
        picked.push(c);
        pickedIds.add(c.id);
      }
    }
  }

  // 2. Распределяем остаток по группам с учётом basePercent
  let remaining = cheeseCount - picked.length;
  if (remaining < 0) remaining = 0;

  if (remaining > 0) {
    const activeGroups = groups.filter((g) =>
      g.candidates.some((c) => !pickedIds.has(c.id)),
    );
    if (activeGroups.length > 0) {
      let sumBase = activeGroups.reduce((acc, g) => acc + Math.max(g.basePercent, 0), 0);
      if (sumBase <= 0) {
        sumBase = activeGroups.length;
        activeGroups.forEach((g) => (g.basePercent = 1));
      }

      const rawCounts = activeGroups.map((g) =>
        (remaining * Math.max(g.basePercent, 0)) / sumBase,
      );
      const counts = rawCounts.map((x) => Math.floor(x));
      let assigned = counts.reduce((acc, x) => acc + x, 0);

      // добиваем до нужного количества по наибольшим дробным частям
      let left = remaining - assigned;
      if (left > 0) {
        const fractions = rawCounts.map((x, i) => ({ i, frac: x - counts[i] }));
        fractions.sort((a, b) => b.frac - a.frac);
        let idx = 0;
        while (left > 0 && idx < fractions.length) {
          counts[fractions[idx].i] += 1;
          left -= 1;
          idx += 1;
        }
      }

      // выбираем из групп
      for (let gi = 0; gi < activeGroups.length; gi += 1) {
        const g = activeGroups[gi];
        let need = counts[gi] || 0;
        if (need <= 0) continue;

        const pool = g.candidates.filter((c) => !pickedIds.has(c.id));
        if (!pool.length) continue;

        const shuffled = shuffle(pool);
        if (need > shuffled.length) need = shuffled.length;
        for (let i = 0; i < need; i += 1) {
          const c = shuffled[i];
          picked.push(c);
          pickedIds.add(c.id);
        }
      }
    }
  }

  // 3. Если всё ещё не набрали — добираем из всех доступных
  let remainingAfterGroups = cheeseCount - picked.length;
  if (remainingAfterGroups > 0) {
    const pool = allCandidates.filter((c) => !pickedIds.has(c.id));
    if (pool.length > 0) {
      const shuffledPool = shuffle(pool);
      const take = Math.min(remainingAfterGroups, shuffledPool.length);
      for (let i = 0; i < take; i += 1) {
        const c = shuffledPool[i];
        picked.push(c);
        pickedIds.add(c.id);
      }
    }
  }

  if (!picked.length) return null;

  const items: CheesePlateItem[] = picked.map((p) => ({
    id: p.id,
    name: p.name,
    imageUrl: p.imageUrl,
    unit: p.unit,
    priceRub: p.priceRub,
    approxPiecePriceRub: p.approxPiecePriceRub,
    categoryId: p.categoryId,
    categoryName: p.categoryName,
  }));

  const approxTotalRub = items.reduce((sum, it) => sum + it.approxPiecePriceRub, 0);

  return { products: items, approxTotalRub };
}

export async function buildCheesePlate(
  options: BuildCheesePlateOptions,
): Promise<CheesePlate | null> {
  const cheeseCount = clampCheeseCount(options.cheeseCount);
  const dataset = await loadConstructorDataset(!!options.excludeMold);

  if (!dataset.allCandidates.length || !dataset.groups.length) return null;

  const favoriteCategoryId =
    options.favoriteCategoryId && typeof options.favoriteCategoryId === 'string'
      ? options.favoriteCategoryId
      : null;

  const targetPrice =
    typeof options.targetPriceRub === 'number' && !Number.isNaN(options.targetPriceRub)
      ? options.targetPriceRub
      : null;

  // Если указана целевая цена — делаем несколько попыток и выбираем лучшую
  if (targetPrice && targetPrice > 0) {
    const attempts = 40;
    let best: CheesePlate | null = null;
    let bestDiff: number | null = null;

    for (let i = 0; i < attempts; i += 1) {
      const plate = buildRandomPlate({ dataset, cheeseCount, favoriteCategoryId });
      if (!plate) continue;
      const diff = Math.abs(plate.approxTotalRub - targetPrice);
      if (bestDiff === null || diff < bestDiff) {
        best = plate;
        bestDiff = diff;
      }
    }

    if (best && bestDiff !== null && bestDiff <= 300) {
      return best;
    }

    return null;
  }

  return buildRandomPlate({ dataset, cheeseCount, favoriteCategoryId });
}

export async function buildSuggestions(count: number = 4): Promise<CheesePlate[]> {
  const dataset = await loadConstructorDataset(false);

  if (!dataset.allCandidates.length || !dataset.groups.length) return [];

  const targetCount = Math.min(Math.max(Math.round(count) || 4, 1), 6);

  const result: CheesePlate[] = [];
  const seen = new Set<string>();
  let attempts = targetCount * 4;

  while (result.length < targetCount && attempts > 0) {
    attempts -= 1;
    const cheeseCount = clampCheeseCount(null);
    const plate = buildRandomPlate({ dataset, cheeseCount, favoriteCategoryId: null });
    if (!plate) break;
    const key = plate.products
      .map((p) => p.id)
      .slice()
      .sort()
      .join(',');

    if (!seen.has(key)) {
      seen.add(key);
      result.push(plate);
    }
  }

  return result;
}
