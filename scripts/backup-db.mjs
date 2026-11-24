#!/usr/bin/env node
/**
 * Целостная копия базы SQLite (prisma/dev.db) — можно запускать при работающем сайте.
 * Используется встроенная команда SQLite «VACUUM INTO»: она делает согласованный снимок,
 * даже если в этот момент оформляется заказ (простое копирование файла может поймать
 * базу «на середине записи» и дать битую копию).
 *
 *   node scripts/backup-db.mjs /root/backups/db/dev-2026-11-24.db
 *
 * Обычно вызывается из scripts/backup.sh (раз в сутки по cron) — см. docs/backup.md.
 */
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const target = process.argv[2];
if (!target) {
  console.error("Укажите файл копии: node scripts/backup-db.mjs <путь>");
  process.exit(1);
}
const dbFile = path.resolve(process.env.DB_FILE || "prisma/dev.db"); // DB_FILE — только для проверки
if (!fs.existsSync(dbFile)) {
  console.error(`Нет базы: ${dbFile} (запускайте из папки проекта)`);
  process.exit(1);
}
const out = path.resolve(target);
fs.mkdirSync(path.dirname(out), { recursive: true });
if (fs.existsSync(out)) fs.rmSync(out); // VACUUM INTO не перезаписывает существующий файл

const prisma = new PrismaClient({ datasources: { db: { url: `file:${dbFile}` } } });
try {
  await prisma.$executeRawUnsafe(`VACUUM INTO '${out.replace(/'/g, "''")}'`);
  const kb = Math.round(fs.statSync(out).size / 1024);
  console.log(`✓ копия базы: ${out} (${kb} КБ)`);
} catch (e) {
  console.error("✗ не удалось сделать копию базы:", e.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
