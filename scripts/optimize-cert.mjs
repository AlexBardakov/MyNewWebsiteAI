import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

async function optimizeCert() {
  const inputPath = path.join(process.cwd(), 'public', 'certificate-bg.png');
  // Сохраняем рядом новый, легкий файл в формате webp
  const outputPath = path.join(process.cwd(), 'public', 'certificate-bg.webp');

  try {
    const buffer = await fs.readFile(inputPath);
    console.log('Сжимаем фон сертификата...');

    await sharp(buffer)
      // Слегка уменьшим разрешение. 1000px по ширине для экрана хватит за глаза,
      // а вес упадет кардинально
      .resize({ width: 1000, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(outputPath);

    console.log('✅ Фон сохранен как супер-легкий WebP!');
  } catch (error) {
    console.error('Ошибка при обработке:', error);
  }
}

optimizeCert();