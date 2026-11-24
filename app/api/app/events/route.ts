/**
 * GET /api/app/events?after=N — новые события после события №N (по возрастанию, до 50 шт.).
 * Ответ: { events: [{ id, type, entityId, title, body, createdAt }], cursor }
 * cursor — номер последнего отданного события (или N, если новых нет); приложение
 * сохраняет его и в следующий раз спрашивает after=cursor.
 * Приложение опрашивает раз в ~15 минут (WorkManager) и при открытии.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAppDevice, badRequest } from "@/lib/app-api/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAppDevice(req);
  if (auth instanceof NextResponse) return auth;

  const after = Number(new URL(req.url).searchParams.get("after") ?? "0");
  if (!Number.isInteger(after) || after < 0) return badRequest("after должен быть целым числом ≥ 0");

  const rows = await prisma.appEvent.findMany({ where: { id: { gt: after } }, orderBy: { id: "asc" }, take: 50 });
  return NextResponse.json({
    events: rows.map((e) => ({
      id: e.id,
      type: e.type,
      entityId: e.entityId,
      title: e.title,
      body: e.body,
      createdAt: e.createdAt.toISOString(),
    })),
    cursor: rows.length ? rows[rows.length - 1].id : after,
  });
}
