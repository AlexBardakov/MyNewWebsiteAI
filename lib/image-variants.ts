/**
 * Сжатые копии картинок из /uploads.
 *
 * Зачем. Next.js не умеет оптимизировать картинки, загруженные в public/ уже после
 * сборки (а /uploads наполняется из админки и отдаётся напрямую nginx'ом), поэтому
 * в next.config.ts стояло `unoptimized: true` и в карточку 216×216 приходил
 * исходник 800×800 PNG весом ~230 КБ.
 *
 * Как теперь. Рядом с каждым исходником лежат готовые копии в webp:
 *   /uploads/2025-10-25/abc.png  →  abc.w160.webp, abc.w480.webp, abc.w800.webp
 * Их создают:
 *   - lib/upload.ts — сразу при загрузке из админки;
 *   - scripts/optimize-images.mjs — один раз для уже загруженных файлов
 *     (ВАЖНО: константы там продублированы — меняете здесь, меняйте и там).
 * А lib/image-loader.ts подставляет в <Image> нужную копию под размер показа.
 * Исходники никогда не трогаются и не удаляются.
 */

/** Ширины копий: 160 — корзина/тарелка/миниатюры, 480 — карточки, 800 — окно товара. */
export const IMAGE_VARIANT_WIDTHS = [160, 480, 800] as const;
export type ImageVariantWidth = (typeof IMAGE_VARIANT_WIDTHS)[number];

/**
 * Качество webp по размерам. Подобрано на реальных фото товаров (ноябрь 2026):
 *   800 (окно товара, фото рассматривают вблизи) — 90: ~128 КБ вместо ~230 КБ PNG;
 *   480 (карточка каталога)                       — 86: ~50 КБ;
 *   160 (миниатюры 40–80 px в корзине/тарелке)    — 82: ~8 КБ.
 * На глаз копии не отличаются от исходника; ниже 80 на сырах с мелкой фактурой
 * (плесень, дырочки) начинают проступать артефакты.
 */
export const IMAGE_VARIANT_QUALITY: Record<ImageVariantWidth, number> = {
  160: 82,
  480: 86,
  800: 90,
};

const SOURCE_EXT_RE = /\.(png|jpe?g|webp|gif)$/i;
const VARIANT_RE = /\.w\d+\.webp$/i;

/** Это сама копия (abc.w480.webp), а не исходник? */
export function isImageVariant(path: string): boolean {
  return VARIANT_RE.test(path);
}

/** Можно ли для этого пути строить копии (картинка из /uploads, не копия). */
export function hasImageVariants(src: string): boolean {
  return src.startsWith("/uploads/") && SOURCE_EXT_RE.test(src) && !isImageVariant(src);
}

/** Наименьшая копия, которая не меньше запрошенной ширины (или самая большая). */
export function pickVariantWidth(requested: number): ImageVariantWidth {
  for (const w of IMAGE_VARIANT_WIDTHS) if (w >= requested) return w;
  return IMAGE_VARIANT_WIDTHS[IMAGE_VARIANT_WIDTHS.length - 1];
}

/** Путь к копии: /uploads/x/abc.png + 480 → /uploads/x/abc.w480.webp */
export function variantPath(src: string, width: ImageVariantWidth): string {
  return src.replace(SOURCE_EXT_RE, `.w${width}.webp`);
}
