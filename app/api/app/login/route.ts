/**
 * POST /api/app/login — вход Android-приложения паролем админки.
 * Тело: { "password": "...", "deviceName": "Xiaomi 13" }
 * Ответ 200: { token, deviceId, cursor } — cursor = номер последнего события,
 * чтобы новое устройство не получило уведомления о старых заказах.
 * Неверный пароль — 401; больше 5 неудачных попыток за 15 минут с адреса — 429.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/passwords";
import { newDeviceToken, badRequest } from "@/lib/app-api/auth";
import { clientIp, registerFailure, resetFailures, retryAfterSeconds } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const LIMIT = { max: 5, windowMs: 15 * 60_000 };

export async function POST(req: Request) {
  const key = `app-login:${clientIp(req.headers)}`;
  const wait = retryAfterSeconds(key, LIMIT);
  if (wait > 0) {
    return NextResponse.json(
      { error: "too_many_attempts", message: `Слишком много попыток. Попробуйте через ${Math.ceil(wait / 60)} мин.` },
      { status: 429, headers: { "Retry-After": String(wait) } },
    );
  }

  let body: { password?: unknown; deviceName?: unknown };
  try {
    body = await req.json();
  } catch {
    return badRequest("Ожидается JSON");
  }
  const password = typeof body.password === "string" ? body.password : "";
  const deviceName = (typeof body.deviceName === "string" ? body.deviceName : "").trim().slice(0, 80) || "Android";
  if (!password) return badRequest("Введите пароль");

  const expectedHash = process.env.ADMIN_PASSWORD_HASH;
  if (!expectedHash) {
    console.error("ADMIN_PASSWORD_HASH не задан — вход в приложение невозможен.");
    return NextResponse.json({ error: "server_config", message: "Ошибка настройки сервера" }, { status: 500 });
  }

  if (!(await verifyPassword(password, expectedHash))) {
    registerFailure(key, LIMIT);
    return NextResponse.json({ error: "wrong_password", message: "Неверный пароль" }, { status: 401 });
  }
  resetFailures(key);

  const { token, hash } = newDeviceToken();
  const device = await prisma.appDevice.create({ data: { name: deviceName, tokenHash: hash, lastSeenAt: new Date() } });
  const last = await prisma.appEvent.findFirst({ orderBy: { id: "desc" }, select: { id: true } });

  return NextResponse.json({ token, deviceId: device.id, cursor: last?.id ?? 0 });
}
