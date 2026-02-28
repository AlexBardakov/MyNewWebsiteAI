'use server'

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { signSession } from "@/lib/auth";

const COOKIE_NAME = "admin_session";

export async function loginAction(prevState: any, formData: FormData) {
  const password = formData.get("password") as string;

  if (!process.env.ADMIN_PASSWORD) {
    console.error("ADMIN_PASSWORD is not set in environment variables");
    return { error: "Ошибка конфигурации сервера", success: false };
  }

  if (password !== process.env.ADMIN_PASSWORD) {
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