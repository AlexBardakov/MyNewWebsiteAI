import { writeFile, mkdir } from "fs/promises";
import path from "path";
import sharp from "sharp";

export async function uploadFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Генерируем уникальное имя
  const originalName = file.name.split('.')[0].replaceAll(" ", "_");
  // Принудительно сохраняем всё в современном формате .webp для максимального сжатия
  const filename = `${Date.now()}_${originalName}.webp`;

  // Путь сохранения: public/uploads
  const uploadDir = path.join(process.cwd(), "public/uploads");

  // Создаем папку, если нет
  try {
    await mkdir(uploadDir, { recursive: true });
  } catch (e) {}

  // ОПТИМИЗАЦИЯ: ужимаем до 800px по ширине и конвертируем в WebP
  const optimizedBuffer = await sharp(buffer)
    .resize({ width: 800, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  await writeFile(path.join(uploadDir, filename), optimizedBuffer);

  return `/uploads/${filename}`;
}