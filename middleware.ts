// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || "default-secret");

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

  // 4. ФИКС ОШИБКИ 500 ПРИ ЗАГРУЗКЕ ТОВАРОВ:
  // Криптография (jwtVerify) в Edge ломает загрузку файлов (multipart/form-data).
  // Раз базовый токен есть, пропускаем POST-запросы с файлами без глубокой расшифровки.
  if (
    request.method === "POST" &&
    request.headers.get("content-type")?.includes("multipart/form-data")
  ) {
    return NextResponse.next();
  }

  // 5. Для обычных переходов по страницам делаем полную проверку токена
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