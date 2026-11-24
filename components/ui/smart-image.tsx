"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

/**
 * next/image с подстраховкой для картинок из /uploads.
 *
 * Обычно показывается сжатая webp-копия (lib/image-loader.ts). Если копии нет
 * (например, файл загрузили в обход админки и скрипт scripts/optimize-images.mjs
 * ещё не запускали) — браузер получит 404, и мы один раз переключаемся на исходник
 * (unoptimized = отдать src как есть). Посетитель видит картинку в любом случае.
 *
 * Используется везде, где показываются фото товаров и рецептов.
 */
export default function SmartImage({ onError, unoptimized, ...props }: ImageProps) {
  const [fallback, setFallback] = useState(false);

  return (
    <Image
      {...props}
      unoptimized={unoptimized || fallback}
      onError={(e) => {
        if (!fallback) setFallback(true);
        onError?.(e);
      }}
    />
  );
}
