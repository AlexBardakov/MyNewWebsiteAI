/**
 * Диагностическая утилита: проверяет совпадение пароля с хешем из ADMIN_PASSWORD_HASH.
 *
 * Использование (интерактивно, БЕЗ передачи пароля через argv — это безопаснее):
 *
 *   npx tsx --env-file=.env scripts/verify-password.ts
 *
 * Скрипт:
 *   1) прочитает ADMIN_PASSWORD_HASH из текущего .env (через `process.env`);
 *   2) попросит ввести пароль в терминале;
 *   3) сравнит и скажет — совпало или нет.
 *
 * Если хеш некорректный (обрезан, не bcrypt-формат) — скрипт скажет об этом отдельно.
 */

import { verifyPassword } from "../lib/passwords";
import { createInterface } from "node:readline";

function readPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  const hash = process.env.ADMIN_PASSWORD_HASH;

  console.log("");
  if (!hash) {
    console.error("❌ Переменная ADMIN_PASSWORD_HASH не задана в окружении.");
    console.error("   Node.js сам по себе .env не читает — нужно подгрузить.");
    console.error("");
    console.error("   Запусти так:");
    console.error("     npx tsx --env-file=.env scripts/verify-password.ts");
    process.exit(1);
  }

  // Базовая проверка формата bcrypt-хеша.
  const looksLikeBcrypt = /^\$2[aby]\$\d{1,2}\$.{53}$/.test(hash);
  console.log(`📋 Длина хеша: ${hash.length} символов (ожидается 60)`);
  console.log(`📋 Формат:    ${looksLikeBcrypt ? "✅ похоже на bcrypt" : "⚠️  НЕ похоже на bcrypt (обрезан? с пробелами? в кавычках?)"}`);

  if (hash.length !== 60) {
    console.warn("");
    console.warn("⚠️  Длина не 60. Скорее всего хеш скопирован не полностью или с лишними пробелами.");
  }

  console.log("");
  const password = await readPassword("Введи пароль для проверки: ");

  if (!password) {
    console.error("Пустой пароль — нечего проверять.");
    process.exit(1);
  }

  console.log("");
  console.log(`📋 Длина введённого пароля: ${password.length} символов`);

  const ok = await verifyPassword(password, hash);

  console.log("");
  if (ok) {
    console.log("✅ СОВПАДАЕТ. Пароль и хеш матчатся.");
    console.log("   Если в админке всё равно не пускает — значит на проде .env подгружается");
    console.log("   с другим значением ADMIN_PASSWORD_HASH или процесс не перезапущен после смены env.");
  } else {
    console.log("❌ НЕ СОВПАДАЕТ. Введённый пароль не соответствует хешу.");
    console.log("");
    console.log("   Возможные причины:");
    console.log("     1) При создании хеша в командной строке spec-символы ($, !, \\) исказились");
    console.log("        из-за двойных кавычек bash. Используй ОДИНАРНЫЕ или интерактивный режим:");
    console.log("        npx tsx scripts/hash-password.ts   (без аргумента — попросит ввести)");
    console.log("     2) Лишние пробелы в пароле при создании хеша или сейчас.");
    console.log("     3) Раскладка/кодировка (если пароль содержит кириллицу).");
  }
}

main().catch((err) => {
  console.error("Ошибка:", err);
  process.exit(1);
});
