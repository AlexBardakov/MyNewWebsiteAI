import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

async function optimizeSubdirectories() {
  const rootDirectory = path.join(process.cwd(), 'public/uploads');

  try {
    // Читаем корень с флагом withFileTypes, чтобы сразу понимать, где файл, а где папка
    const items = await fs.readdir(rootDirectory, { withFileTypes: true });

    for (const item of items) {
      // Нас интересуют ТОЛЬКО папки (директории)
      if (item.isDirectory()) {
        const subDirPath = path.join(rootDirectory, item.name);
        console.log(`\n📂 Зашли во вложенную папку: ${item.name}`);

        // Читаем содержимое этой вложенной папки
        const files = await fs.readdir(subDirPath);

        for (const file of files) {
          // Ищем только картинки
          if (!file.match(/\.(jpg|jpeg|png|webp)$/i)) continue;

          const filePath = path.join(subDirPath, file);

          // На всякий случай проверяем, не является ли этот "файл" еще одной папкой
          const fileStat = await fs.stat(filePath);
          if (fileStat.isDirectory()) continue;

          console.log(`  Оптимизируем: ${file}...`);

          const fileBuffer = await fs.readFile(filePath);

          // Сжимаем до 800px и качества 80%
          const optimizedBuffer = await sharp(fileBuffer)
            .resize({ width: 800, withoutEnlargement: true })
            .jpeg({ quality: 80, force: false })
            .png({ quality: 80, force: false })
            .webp({ quality: 80, force: false })
            .toBuffer();

          // Перезаписываем
          await fs.writeFile(filePath, optimizedBuffer);
        }
      }
    }
    console.log('\n✅ Все фотографии во вложенных папках успешно сжаты!');
  } catch (error) {
    console.error('Ошибка при обработке:', error);
  }
}

optimizeSubdirectories();