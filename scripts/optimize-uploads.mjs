import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

async function optimizeExistingImages() {
  const directory = path.join(process.cwd(), 'public/uploads');

  try {
    const files = await fs.readdir(directory);

    for (const file of files) {
      // Берем только картинки
      if (!file.match(/\.(jpg|jpeg|png|webp)$/i)) continue;

      const filePath = path.join(directory, file);
      const fileBuffer = await fs.readFile(filePath);

      console.log(`Оптимизируем: ${file}...`);

      // Уменьшаем размер до 800px по ширине (для карточек товаров этого более чем достаточно)
      // и сжимаем качество до 80%
      const optimizedBuffer = await sharp(fileBuffer)
        .resize({ width: 800, withoutEnlargement: true })
        .jpeg({ quality: 80, force: false })
        .png({ quality: 80, force: false })
        .webp({ quality: 80, force: false })
        .toBuffer();

      // Перезаписываем оригинальный файл
      await fs.writeFile(filePath, optimizedBuffer);
    }
    console.log('✅ Все картинки успешно сжаты!');
  } catch (error) {
    console.error('Ошибка при обработке:', error);
  }
}

optimizeExistingImages();