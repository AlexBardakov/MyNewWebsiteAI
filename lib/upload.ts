import { writeFile, mkdir } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { IMAGE_VARIANT_QUALITY, IMAGE_VARIANT_WIDTHS } from "@/lib/image-variants";

/**
 * Безопасное имя файла: оставляем буквы (в т.ч. кириллицу), цифры, «-» и «_».
 * Символы вроде # % ? & / \ в имени ломают URL картинки (например, «Сыр #1.jpg»
 * превращался в ссылку с якорем и картинка не находилась).
 */
function safeBaseName(fileName: string): string {
  const base = fileName.replace(/\.[^.]*$/, ""); // без расширения
  const clean = base
    .normalize("NFC")
    .replace(/[^\p{L}\p{N}_-]+/gu, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 60);
  return clean || "image";
}

/**
 * Сохраняет картинку из админки в public/uploads и сразу создаёт сжатые копии
 * для сайта (см. lib/image-variants.ts):
 *   <имя>.webp        — основной файл (800 px), путь к нему пишется в БД;
 *   <имя>.w800.webp   — копия для окна товара (те же байты, что и основной);
 *   <имя>.w480.webp   — копия для карточек;
 *   <имя>.w160.webp   — миниатюры.
 * Все копии делаются из загруженного исходника (а не друг из друга),
 * чтобы не терять качество на повторном сжатии.
 */
export async function uploadFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());

  const base = `${Date.now()}_${safeBaseName(file.name)}`;
  const uploadDir = path.join(process.cwd(), "public/uploads");
  await mkdir(uploadDir, { recursive: true });

  const encode = (width: (typeof IMAGE_VARIANT_WIDTHS)[number]) =>
    sharp(buffer)
      .rotate() // учесть EXIF-ориентацию: фото с телефона иначе может лечь на бок
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: IMAGE_VARIANT_QUALITY[width], smartSubsample: true, effort: 5 })
      .toBuffer();

  // Основной файл = копия 800 px.
  const main = await encode(800);
  await writeFile(path.join(uploadDir, `${base}.webp`), main);
  await writeFile(path.join(uploadDir, `${base}.w800.webp`), main);

  for (const w of IMAGE_VARIANT_WIDTHS) {
    if (w === 800) continue;
    await writeFile(path.join(uploadDir, `${base}.w${w}.webp`), await encode(w));
  }

  return `/uploads/${base}.webp`;
}
