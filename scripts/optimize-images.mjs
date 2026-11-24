#!/usr/bin/env node
/**
 * Создаёт сжатые webp-копии (160 / 480 / 800 px) для всех картинок в public/uploads.
 *
 * Запуск на сервере из папки проекта (/root/fourkingssite):
 *   node scripts/optimize-images.mjs --dry-run   # только показать, что будет сделано
 *   node scripts/optimize-images.mjs             # создать недостающие копии
 *
 * Дополнительно:
 *   --dir=путь   другая папка (по умолчанию public/uploads)
 *   --force      пересоздать уже существующие копии
 *
 * Безопасность:
 *   - исходники НЕ изменяются и НЕ удаляются — скрипт только добавляет файлы *.wNNN.webp;
 *   - повторный запуск ничего не ломает: готовые копии пропускаются;
 *   - видео и прочие файлы не трогаются.
 *
 * Правила копий продублированы из lib/image-variants.ts — меняете там, меняйте и здесь.
 */
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const WIDTHS = [160, 480, 800];
// Качество по ширине — см. пояснение в lib/image-variants.ts (IMAGE_VARIANT_QUALITY).
const QUALITY = { 160: 82, 480: 86, 800: 90 };
const SOURCE_EXT_RE = /\.(png|jpe?g|webp|gif)$/i;
const VARIANT_RE = /\.w\d+\.webp$/i;

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const force = args.includes("--force");
const dirArg = args.find((a) => a.startsWith("--dir="));
const root = path.resolve(dirArg ? dirArg.slice(6) : "public/uploads");

async function* walk(dir) {
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (e.isFile()) yield p;
  }
}

const exists = (p) => fs.access(p).then(() => true, () => false);
const kb = (n) => `${Math.round(n / 1024)} КБ`;

async function main() {
  if (!(await exists(root))) {
    console.error(`Папка не найдена: ${root}`);
    process.exit(1);
  }
  console.log(`${dryRun ? "[ПРОБНЫЙ ПРОГОН] " : ""}Папка: ${root}\n`);

  let sources = 0, created = 0, skipped = 0, failed = 0;
  let srcBytes = 0;
  const outBytes = Object.fromEntries(WIDTHS.map((w) => [w, 0]));

  for await (const file of walk(root)) {
    if (!SOURCE_EXT_RE.test(file) || VARIANT_RE.test(file)) continue;
    sources++;
    const srcStat = await fs.stat(file);
    srcBytes += srcStat.size;

    let meta;
    try {
      meta = await sharp(file).metadata();
    } catch (e) {
      failed++;
      console.error(`✗ не читается: ${path.relative(root, file)} — ${e.message}`);
      continue;
    }
    // Ширина с учётом EXIF-поворота (фото с телефона бывают «лёжа» в файле).
    const srcWidth = meta.orientation >= 5 ? meta.height : meta.width;
    const isWebp = meta.format === "webp";

    for (const w of WIDTHS) {
      const out = file.replace(SOURCE_EXT_RE, `.w${w}.webp`);
      if (!force && (await exists(out))) {
        skipped++;
        outBytes[w] += (await fs.stat(out)).size;
        continue;
      }
      if (dryRun) {
        created++;
        continue;
      }
      try {
        if (isWebp && srcWidth <= w) {
          // Исходник уже webp и не шире копии — просто копируем байты,
          // без повторного сжатия (чтобы не терять качество на пересжатии).
          await fs.copyFile(file, out);
        } else {
          await sharp(file)
            .rotate() // применить EXIF-ориентацию, иначе фото с телефона ляжет на бок
            .resize({ width: w, withoutEnlargement: true })
            .webp({ quality: QUALITY[w], smartSubsample: true, effort: 5 })
            .toFile(out);
        }
        created++;
        outBytes[w] += (await fs.stat(out)).size;
      } catch (e) {
        failed++;
        console.error(`✗ ошибка: ${path.relative(root, out)} — ${e.message}`);
      }
    }
  }

  console.log(`Исходных картинок: ${sources} (${kb(srcBytes)})`);
  console.log(`${dryRun ? "Будет создано" : "Создано"} копий: ${created}, уже были: ${skipped}, ошибок: ${failed}`);
  if (!dryRun) {
    for (const w of WIDTHS) console.log(`  копии ${w}px: всего ${kb(outBytes[w])}`);
  }
  if (failed > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
