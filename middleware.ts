// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Проверяем только пути, начинающиеся с /admin
  if (request.nextUrl.pathname.startsWith("/admin")) {

    // Исключаем страницу входа, чтобы не было бесконечного цикла
    if (request.nextUrl.pathname === "/admin/login") {
      return NextResponse.next();
    }

    // Ищем куку
    const cookie = request.cookies.get("admin_session");
    const token = cookie?.value;

    // Если куки нет или она не равна "true" (как мы записали в actions.ts) — на выход
    if (!token || token !== "true") {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    // Если все ок — пропускаем
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};