// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(request: NextRequest) {
  // Проверяем только пути, начинающиеся с /admin
  if (request.nextUrl.pathname.startsWith("/admin")) {

    // Исключаем страницу входа, чтобы не было бесконечного цикла
    if (request.nextUrl.pathname === "/admin/login") {
      return NextResponse.next();
    }

    // Ищем куку
    const token = request.cookies.get("admin_session")?.value;
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "default-secret");

    // Если токена нет или он невалидный — на выход
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    try {
      await jwtVerify(token, secret);
      // Все ок, пропускаем
      return NextResponse.next();
    } catch (err) {
      // Токен протух или поддельный
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};