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

  // ============================================================
  // ВРЕМЕННОЕ ДИАГНОСТИЧЕСКОЕ ЛОГИРОВАНИЕ (удалить после фикса!)
  // Печатает в pm2 logs точную картину: что Next.js реально видит
  // в process.env и какой результат bcrypt.compare.
  // ============================================================
  console.log("=== LOGIN DEBUG ===");
  console.log("cwd:", process.cwd());
  console.log("password length:", password?.length ?? "(no password)");
  console.log("hash type:", typeof expectedHash);
  console.log("hash length:", expectedHash?.length ?? 0, "(должно быть 60)");
  if (expectedHash) {
    console.log("hash starts with:", JSON.stringify(expectedHash.slice(0, 10)));
    console.log("hash ends with:  ", JSON.stringify(expectedHash.slice(-10)));
    console.log("hash bcrypt regex match:", /^\$2[aby]\$\d{1,2}\$.{53}$/.test(expectedHash));
  }
  const allAdminEnv = Object.keys(process.env)
    .filter((k) => k.startsWith("ADMIN_"))
    .map((k) => `${k}=(${(process.env[k] || "").length} chars)`);
  console.log("all ADMIN_* env keys:", allAdminEnv);
  console.log("===================");
  // ============================================================

  if (!expectedHash) {
    console.error(
      "ADMIN_PASSWORD_HASH не задан в переменных окружения. " +
      "Создайте хеш через npm run hash-password и добавьте его в env."
    );
    return { error: "Ошибка конфигурации сервера", success: false };
  }

  if (!password) {
    return { error: "Введите пароль", success: false };
  }

  const ok = await verifyPassword(password, expectedHash);

  // === ВРЕМЕННОЕ ЛОГИРОВАНИЕ ===
  console.log("verifyPassword result:", ok);
  // =============================

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