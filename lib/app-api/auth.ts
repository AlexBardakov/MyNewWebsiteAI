/**
 * Авторизация Android-приложения админа (API /api/app/*).
 *
 * Приложение входит паролем админки (POST /api/app/login) и получает ключ устройства —
 * случайные 32 байта. В базе хранится только sha256 от ключа (таблица AppDevice),
 * сам ключ живёт лишь на телефоне. Каждый запрос приложения несёт заголовок
 *   Authorization: Bearer <ключ>
 * Ключ бессрочный, пока устройство не отключено в веб-админке (/admin/devices) или
 * приложение не вышло само (POST /api/app/logout).
 *
 * Cookie не используются — поэтому CSRF к этому API неприменим.
 */
import { createHash, randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export function newDeviceToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export type AppDeviceRecord = { id: string; name: string };

/**
 * Возвращает устройство или готовый ответ 401.
 * Использование в route handler:
 *   const auth = await requireAppDevice(req); if (auth instanceof NextResponse) return auth;
 */
export async function requireAppDevice(req: Request): Promise<AppDeviceRecord | NextResponse> {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return unauthorized();

  const device = await prisma.appDevice.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!device || device.revokedAt) return unauthorized();

  // Отмечаем «был на связи» не чаще раза в 5 минут — без лишних записей в БД.
  if (!device.lastSeenAt || Date.now() - device.lastSeenAt.getTime() > 5 * 60_000) {
    await prisma.appDevice.update({ where: { id: device.id }, data: { lastSeenAt: new Date() } }).catch(() => {});
  }
  return { id: device.id, name: device.name };
}

export function unauthorized() {
  return NextResponse.json(
    { error: "unauthorized", message: "Устройство не авторизовано. Войдите в приложение заново." },
    { status: 401 },
  );
}

export function badRequest(message: string) {
  return NextResponse.json({ error: "bad_request", message }, { status: 400 });
}
