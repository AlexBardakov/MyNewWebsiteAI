"use server";

import { signSession } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function loginAction(prevState: any, formData: FormData) {
  const password = formData.get("password") as string;

  // Простая проверка пароля
  if (password !== process.env.ADMIN_PASSWORD) {
    return { error: "Неверный пароль" };
  }

  // Создаем сессию
  const token = await signSession();

  // Сохраняем куку
  const cookieStore = await cookies();
  cookieStore.set("admin_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  // Редирект в админку
  redirect("/admin");
}