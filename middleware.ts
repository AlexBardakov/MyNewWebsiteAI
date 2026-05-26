// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Жёсткое требование: JWT_SECRET ОБЯЗАН быть задан в env (см. lib/auth.ts).
// Fallback `|| "default-secret"` удалён сознательно — лучше упасть при старте,
// чем тихо работать с публично известным секретом.
const rawSecret = process.env.JWT_SECRET;
if (!rawSecret || rawSecret.length < 32) {
  throw new Error(
    "JWT_SECRET не задан или короче 32 символов. " +
    "Задайте надёжный секрет в переменных окружения перед запуском приложения."
  );
}
const SECRET_KEY = new TextEncoder().encode(rawSecret);

export async function middleware(request: NextRequest) {
  // 1. Исключаем страницу входа
  if (request.nextUrl.pathname === "/admin/login") {
    return NextResponse.next();
  }

  // 2. Ищем куку
  const cookie = request.cookies.get("admin_session");
  const token = cookie?.value;

  // 3. Если токена нет совсем — сразу на выход
  if (!token) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  // 4. Обходной путь для multipart-запросов.
  // ПРИЧИНА: jwtVerify в Edge runtime ломает обработку multipart/form-data
  // в Next.js 16 + Turbopack (POST на /admin/products даёт 500 при загрузке файла).
  // Здесь мы проверяем только ФАКТ наличия cookie `admin_session`, без расшифровки.
  //
  // БЕЗОПАСНОСТЬ: дыра, которая возникает из-за этого обхода (любой cookie проходит),
  // закрыта на уровне самих server actions: каждая привилегированная функция в
  // app/admin/*/actions.ts вызывает requireAdminSession() (см. lib/auth-server.ts),
  // которая делает полный jwtVerify уже в Node runtime, где проблем нет.
  // То есть это уровень "1.5" — мы пропускаем сверку в middleware, но action всё равно
  // проверит JWT перед бизнес-логикой.
  if (
    request.method === "POST" &&
    request.headers.get("content-type")?.includes("multipart/form-data")
  ) {
    return NextResponse.next();
  }

  // 5. Для обычных запросов делаем полную проверку токена в middleware.
  try {
    await jwtVerify(token, SECRET_KEY);
    return NextResponse.next();
  } catch (error) {
    console.error("Middleware: Неверный токен", error);
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
}

export const config = {
  // Оставляем только админку
  matcher: ["/admin/:path*"],
};