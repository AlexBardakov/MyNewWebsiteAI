'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdminSession, UnauthorizedError } from "@/lib/auth-server";

// Исправлено: принимаем id и status как аргументы (так как используем .bind)
export async function updateOrderStatus(id: string, status: string) {
  // Простая валидация
  if (!id || !status) return;

  try {
    await requireAdminSession();

    await prisma.order.update({
      where: { id },
      data: { status },
    });

    // Обновляем кэш страницы списка и страницы самого заказа
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${id}`);

  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    console.error("Ошибка при обновлении статуса:", error);
  }
}
