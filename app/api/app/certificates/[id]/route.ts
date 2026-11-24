/** GET /api/app/certificates/:id — сертификат целиком (отправитель, получатель, контакты). */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAppDevice } from "@/lib/app-api/auth";
import { certificateDetails } from "@/lib/app-api/dto";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAppDevice(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const cert = await prisma.certificate.findUnique({ where: { id } });
  if (!cert) return NextResponse.json({ error: "not_found", message: "Сертификат не найден" }, { status: 404 });
  return NextResponse.json({ certificate: certificateDetails(cert) });
}
