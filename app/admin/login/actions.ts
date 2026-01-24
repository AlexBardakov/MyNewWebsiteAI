'use server'

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Важно: имя куки должно совпадать с тем, что проверяет ваш middleware.ts
// Обычно это 'admin_session' или 'admin_token'
const COOKIE_NAME = "admin_session";

export async function loginAction(formData: FormData) {
  const password = formData.get("password") as string;

  // Проверка пароля из .env файла
  if (password === process.env.ADMIN_PASSWORD) {
    const cookieStore = await cookies();

    cookieStore.set(COOKIE_NAME, "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 дней
      path: "/",
    });

    redirect("/admin");
  } else {
    return { error: "Неверный пароль" };
  }
}

// Вот этой функции не хватало
export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  redirect("/admin/login");
}