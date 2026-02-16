// app/admin/login/actions.ts
'use server'

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { signSession } from "@/lib/auth"; // Импортируем функцию создания токена

const COOKIE_NAME = "admin_session";

export async function loginAction(prevState: any, formData: FormData) {
  const password = formData.get("password") as string;

  // Проверяем наличие переменной окружения (на случай, если забыли добавить на сервер)
  if (!process.env.ADMIN_PASSWORD) {
    console.error("ADMIN_PASSWORD is not set in environment variables");
    return { error: "Ошибка конфигурации сервера" };
  }

  if (password === process.env.ADMIN_PASSWORD) {
    const cookieStore = await cookies();
    
    // Создаем правильный JWT токен
    const token = await signSession();

    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 день (как в signSession)
      path: "/",
      sameSite: 'lax',
    });

    // Редирект должен быть последним действием
    redirect("/admin");
  } else {
    return { error: "Неверный пароль" };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  redirect("/admin/login");
}