'use server'

import { buildCheesePlate, buildSuggestions } from '@/lib/cheesePlateBuilder';

// Вспомогательная функция для стерилизации данных.
// (Prisma может возвращать Decimal или Date, которые Next.js не любит передавать напрямую с сервера на клиент без преобразования)
function serialize<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

export async function getSuggestionsAction(count: number = 4) {
  try {
    const suggestions = await buildSuggestions(count);
    return { ok: true, suggestions: serialize(suggestions) };
  } catch (e: any) {
    console.error('Server Action Error (Suggestions):', e);
    return { ok: false, error: 'Не удалось загрузить варианты тарелок' };
  }
}

export type BuildPlateParams = {
  favoriteCategoryId?: string;
  excludeMold?: boolean;
  cheeseCount?: number;
  targetPriceRub?: number;
};

export async function buildPlateAction(params: BuildPlateParams) {
  try {
    const plate = await buildCheesePlate({
      favoriteCategoryId: params.favoriteCategoryId || null,
      excludeMold: !!params.excludeMold,
      cheeseCount: params.cheeseCount || null,
      targetPriceRub: params.targetPriceRub || null,
    });

    if (!plate) {
      return {
        ok: false,
        error: 'Не удалось подобрать сырную тарелку под заданные условия. Попробуйте изменить параметры (например, убрать фильтр плесени или изменить цену).',
      };
    }

    return { ok: true, plate: serialize(plate) };
  } catch (e: any) {
    console.error('Server Action Error (Build):', e);
    return { ok: false, error: 'Произошла ошибка при сборке тарелки' };
  }
}