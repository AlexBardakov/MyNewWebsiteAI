/**
 * Утилита для создания bcrypt-хеша пароля админа.
 *
 * РЕКОМЕНДУЕМЫЙ способ (интерактивный ввод, без проблем с экранированием bash):
 *
 *   npx tsx scripts/hash-password.ts
 *
 * Скрипт попросит ввести пароль в терминале (ввод скрыт), создаст хеш и выведет его.
 *
 * Альтернативный способ (НЕ рекомендуется, если в пароле есть $, !, \, пробелы):
 *
 *   npx tsx scripts/hash-password.ts 'парольВодинарныхКавычках'
 *
 * ⚠️  ВНИМАНИЕ: ДВОЙНЫЕ кавычки в bash раскрывают $name и !history.
 *     Всегда используй ОДИНАРНЫЕ кавычки, или (надёжнее) — интерактивный режим без аргумента.
 *
 * Скрипт ничего не пишет в БД и не хранит пароль. Он только печатает хеш.
 */

import { hashPassword } from "../lib/passwords";
import { createInterface } from "node:readline";

function askPassword(prompt: string): Promise<string> {
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
  // 1) Если пароль передан аргументом — используем его (предупредим про кавычки).
  // 2) Если аргумента нет — спросим интерактивно через stdin.
  let password = process.argv[2];

  if (password) {
    console.log("");
    console.log("ℹ️  Пароль получен из аргумента командной строки.");
    console.log("   Если в нём есть $, !, \\ — проверь, что использовал ОДИНАРНЫЕ кавычки в bash,");
    console.log("   иначе bash мог раскрыть переменные и пароль исказился.");
    console.log("   В случае сомнений — запусти без аргумента (попросит ввести интерактивно).");
  } else {
    password = await askPassword("Введи пароль для хеширования (виден в терминале): ");
  }

  if (!password) {
    console.error("Ошибка: пустой пароль.");
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("Ошибка: пароль слишком короткий (минимум 8 символов).");
    process.exit(1);
  }

  console.log("");
  console.log(`📋 Длина введённого пароля: ${password.length} символов`);
  console.log(`📋 Первый и последний символы (для контроля): "${password[0]}" ... "${password[password.length - 1]}"`);

  const hash = await hashPassword(password);

  console.log("");
  console.log("Хеш создан. Длина:", hash.length, "(должно быть 60)");
  console.log("");
  console.log("⚠️  ВАЖНО: каждый знак '$' в хеше ОБЯЗАТЕЛЬНО экранировать как \\$.");
  console.log("    Иначе Next.js dotenv-expand интерпретирует '$2a', '$10', '$xxx' как ссылки");
  console.log("    на переменные окружения и хеш будет мутирован.");
  console.log("    Кавычки (одинарные/двойные) ЗДЕСЬ НЕ ПОМОГАЮТ — они снимаются ДО интерполяции.");
  console.log("");

  // Экранируем каждый $ как \$ — стандартный синтаксис dotenv-expand для литерала.
  const escapedHash = hash.replace(/\$/g, "\\$");

  console.log("Скопируй строку ниже в .env как есть (без кавычек):");
  console.log("");
  console.log(`ADMIN_PASSWORD_HASH=${escapedHash}`);
  console.log("");
  console.log("После этого:");
  console.log("  1. Удали (или закомментируй) старую переменную ADMIN_PASSWORD из .env.");
  console.log("  2. Перезапусти приложение с обновлением env:");
  console.log("       pm2 restart fourkingssite --update-env");
  console.log("     (флаг --update-env критичен: без него PM2 не перечитает .env)");
  console.log("  3. Для самопроверки запусти: npx tsx --env-file=.env scripts/verify-password.ts");
  console.log("");
}

main().catch((err) => {
  console.error("Ошибка при создании хеша:", err);
  process.exit(1);
});
