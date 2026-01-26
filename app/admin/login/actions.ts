// app/admin/login/actions.ts
'use server'

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "admin_session";

// ИСПРАВЛЕНИЕ: Добавлен аргумент prevState (первый), так как useActionState передает его автоматически
export async function loginAction(prevState: any, formData: FormData) {
  const password = formData.get("password") as string;

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

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  redirect("/admin/login");
}