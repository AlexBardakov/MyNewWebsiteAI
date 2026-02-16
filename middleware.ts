// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Тот же ключ, что и в lib/auth.ts
const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || "default-secret");

export async function middleware(request: NextRequest) {
  // 1. Проверяем только пути, начинающиеся с /admin
  if (request.nextUrl.pathname.startsWith("/admin")) {

    // 2. Исключаем страницу входа, чтобы не было бесконечного цикла
    if (request.nextUrl.pathname === "/admin/login") {
      return NextResponse.next();
    }

    // 3. Ищем куку
    const cookie = request.cookies.get("admin_session");
    const token = cookie?.value;

    // 4. Если токена нет — на выход
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    // 5. Пробуем расшифровать токен
    try {
      await jwtVerify(token, SECRET_KEY);
      // Если ошибок нет, значит токен верный — пропускаем
      return NextResponse.next();
    } catch (error) {
      // Если токен поддельный или просрочен — на выход
      console.error("Middleware: Неверный токен", error);
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};