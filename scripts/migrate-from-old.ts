import Database from 'better-sqlite3';
import { PrismaClient } from '@prisma/client';
import path from 'path';

const prisma = new PrismaClient();

// Открываем старую базу данных (файл old.db должен лежать в корне проекта)
const oldDbPath = path.join(process.cwd(), 'old.db');
const oldDb = new Database(oldDbPath, { readonly: true }); // Открываем только для чтения

async function main() {
  console.log('🚀 Начинаем перенос данных...');

  // 1. ПЕРЕНОС КАТЕГОРИЙ
  console.log('📦 Переносим категории...');
  
  // Читаем из старой БД
  const oldCategories = oldDb.prepare('SELECT * FROM Category').all() as any[];

  for (const cat of oldCategories) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: {
        // Если категория уже есть, обновляем поля
        name: cat.name,
        isActive: Boolean(cat.isActive),
        displayOrder: cat.displayOrder,
        isMold: Boolean(cat.isMold),
      },
      create: {
        // Если нет, создаем новую с тем же ID
        id: cat.id,
        name: cat.name,
        isActive: Boolean(cat.isActive),
        displayOrder: cat.displayOrder,
        isMold: Boolean(cat.isMold),
      },
    });
  }
  console.log(`✅ Обработано категорий: ${oldCategories.length}`);

  // 2. ПЕРЕНОС ТОВАРОВ
  console.log('🧀 Переносим товары...');
  
  const oldProducts = oldDb.prepare('SELECT * FROM Product').all() as any[];

  for (const prod of oldProducts) {
    // Пропускаем товар, если его категории нет в новой базе (защита от ошибок)
    const categoryExists = await prisma.category.findUnique({ where: { id: prod.categoryId } });
    
    if (!categoryExists) {
      console.warn(`⚠️ Товар "${prod.name}" пропущен: категории ${prod.categoryId} не существует.`);
      continue;
    }

    await prisma.product.upsert({
      where: { id: prod.id },
      update: {
        name: prod.name,
        sigmaName: prod.sigmaName,
        article: prod.article,
        description: prod.description,
        imageUrl: prod.imageUrl,
        priceRub: prod.priceRub,
        unit: prod.unit,
        avgPackWeightGrams: prod.avgPackWeightGrams,
        remainder: prod.remainder,
        isActive: Boolean(prod.isActive),
        displayOrder: prod.displayOrder,
        categoryId: prod.categoryId,
      },
      create: {
        id: prod.id,
        name: prod.name,
        sigmaName: prod.sigmaName,
        article: prod.article,
        description: prod.description,
        imageUrl: prod.imageUrl,
        priceRub: prod.priceRub,
        unit: prod.unit,
        avgPackWeightGrams: prod.avgPackWeightGrams,
        remainder: prod.remainder,
        isActive: Boolean(prod.isActive),
        displayOrder: prod.displayOrder,
        categoryId: prod.categoryId,
      },
    });
  }
  console.log(`✅ Обработано товаров: ${oldProducts.length}`);

  console.log('🎉 Миграция успешно завершена!');
}

main()
  .catch((e) => {
    console.error('❌ Ошибка миграции:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    oldDb.close();
  });