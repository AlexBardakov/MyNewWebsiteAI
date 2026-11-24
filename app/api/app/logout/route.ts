/** POST /api/app/logout — приложение выходит: ключ устройства отзывается. */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAppDevice } from "@/lib/app-api/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await requireAppDevice(req);
  if (auth instanceof NextResponse) return auth;
  await prisma.appDevice.update({ where: { id: auth.id }, data: { revokedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
