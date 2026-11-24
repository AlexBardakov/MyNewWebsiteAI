'use server'

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth-server";

/** Отключить устройство: его ключ перестаёт приниматься API приложения. */
export async function revokeDevice(id: string) {
  await requireAdminSession();
  await prisma.appDevice.update({ where: { id }, data: { revokedAt: new Date() } });
  revalidatePath("/admin/devices");
}
