'use server'

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { signSession } from "@/lib/auth";
import { verifyPassword } from "@/lib/passwords";
import { clientIp, registerFailure, resetFailures, retryAfterSeconds } from "@/lib/rate-limit";

// Не больше 5 неверных паролей за 15 минут с одного адреса — защита от подбора.
// Счётчик общий с входом в Android-приложение (app/api/app/login), ключ «login:IP».
const LOGIN_LIMIT = { max: 5, windowMs: 15 * 60_000 };

const COOKIE_NAME = "admin_session";

export async function loginAction(prevState: any, formData: FormData) {
  const password = formData.get("password") as string;

  // Раньше пароль сравнивался plain-text (`password !== process.env.ADMIN_PASSWORD`),
  // что давало нулевую защиту при компрометации env-файла. Теперь хранится только
  // bcrypt-хеш в ADMIN_PASSWORD_HASH; `verifyPassword` использует bcrypt.compare,
  // который constant-time и устойчив к timing-атакам.
  const expectedHash = process.env.ADMIN_PASSWORD_HASH;
  if (!expectedHash) {
    console.error(
      "ADMIN_PASSWORD_HASH не задан в переменных окружения. " +
      "Создайте хеш через `npx tsx scripts/hash-password.ts` и добавьте его в .env. " +
      "ВАЖНО: в .env каждый знак $ в хеше экранируется как \\$ — иначе dotenv-expand " +
      "интерпретирует $2a, $10 и т.д. как имена переменных и хеш будет мутирован."
    );
    return { error: "Ошибка конфигурации сервера", success: false };
  }

  if (!password) {
    return { error: "Введите пароль", success: false };
  }

  const limitKey = `login:${clientIp(await headers())}`;
  const wait = retryAfterSeconds(limitKey, LOGIN_LIMIT);
  if (wait > 0) {
    return { error: `Слишком много попыток. Попробуйте через ${Math.ceil(wait / 60)} мин.`, success: false };
  }

  const ok = await verifyPassword(password, expectedHash);
  if (!ok) {
    registerFailure(limitKey, LOGIN_LIMIT);
    return { error: "Неверный пароль", success: false };
  }
  resetFailures(limitKey);

  const cookieStore = await cookies();
  const token = await signSession();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24,
    path: "/",
    sameSite: 'lax',
  });

  // ВАЖНО: Вместо redirect() отдаем успешный статус
  return { success: true, error: "" };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  redirect("/admin/login");
}