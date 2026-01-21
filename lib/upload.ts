import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function uploadFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());

  // Генерируем уникальное имя
  const filename = Date.now() + "_" + file.name.replaceAll(" ", "_");

  // Путь сохранения: public/uploads
  const uploadDir = path.join(process.cwd(), "public/uploads");

  // Создаем папку, если нет
  try {
    await mkdir(uploadDir, { recursive: true });
  } catch (e) {}

  await writeFile(path.join(uploadDir, filename), buffer);

  return `/uploads/${filename}`;
}