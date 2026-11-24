// lib/auth-server.ts
//
// Серверная проверка авторизации админа. Используется ВНУТРИ server actions
// как defense in depth — на случай если middleware был обойдён или мисконфигурирован.
//
// Принцип: каждое серверное действие, требующее прав админа, в своей первой строке
// вызывает `requireAdminSession()`. Если cookie нет или JWT невалиден — выбрасывается
// специальная ошибка UnauthorizedError, которую action ловит и возвращает
// `{ error: "..." }` без выполнения бизнес-логики.
//
// Зачем дублировать middleware?
//   1) middleware может пропустить запрос (как было с multipart-обходом — см. историю
//      коммитов и middleware.ts).
//   2) Случайная правка matcher в middleware.ts может исключить нужный путь.
//   3) Defense in depth — стандарт для серверных операций с привилегиями.

import { cookies } from "next/headers";
import { verifySession } from "./auth";

export class UnauthorizedError extends Error {
  constructor(message = "UNAUTHORIZED") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

const COOKIE_NAME = "admin_session";

/**
 * Бросает UnauthorizedError, если запрос не авторизован как админ.
 * Возвращает payload токена (содержит role) при успехе.
 *
 * Использование в server action:
 *
 *   export async function someAdminAction() {
 *     try {
 *       await requireAdminSession();
 *       // ... бизнес-логика
 *     } catch (e) {
 *       if (e instanceof UnauthorizedError) {
 *         return { error: "Сессия истекла. Войдите снова." };
 *       }
 *       throw e;
 *     }
 *   }
 */
export async function requireAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    throw new UnauthorizedError("Отсутствует cookie admin_session");
  }

  const payload = await verifySession(token);

  if (!payload) {
    throw new UnauthorizedError("Невалидный или просроченный токен");
  }

  if (payload.role !== "admin") {
    throw new UnauthorizedError("Недостаточно прав");
  }

  return payload;
}
