import type { ImageLoaderProps } from "next/image";
import { hasImageVariants, pickVariantWidth, variantPath } from "./image-variants";

/**
 * Загрузчик для next/image (подключён в next.config.ts → images.loaderFile).
 *
 * Для картинок из /uploads возвращает готовую сжатую webp-копию подходящей
 * ширины (см. lib/image-variants.ts). Браузер сам выбирает нужную из srcset
 * по атрибуту `sizes` и плотности экрана.
 *
 * Всё остальное (логотип, фон сертификата и прочие файлы из public/) отдаётся
 * как есть — для них копий нет.
 *
 * Если копии вдруг не окажется на сервере, components/ui/smart-image.tsx
 * переключит картинку на исходник — сломанной картинки посетитель не увидит.
 */
export default function imageLoader({ src, width }: ImageLoaderProps): string {
  if (!hasImageVariants(src)) return src;
  return variantPath(src, pickVariantWidth(width));
}
