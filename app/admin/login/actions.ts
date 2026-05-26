'use server'

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { signSession } from "@/lib/auth";
import { verifyPassword } from "@/lib/passwords";

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

  const ok = await verifyPassword(password, expectedHash);
  if (!ok) {
    return { error: "Неверный пароль", success: false };
  }

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