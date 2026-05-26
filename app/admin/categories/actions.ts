"use server";

import { db } from "@/lib/db"; // Убедитесь, что у вас есть этот файл (или prisma.ts)
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminSession, UnauthorizedError } from "@/lib/auth-server";

// Схема валидации
const categorySchema = z.object({
  name: z.string().min(1, "Название обязательно"),
  displayOrder: z.coerce.number().default(0),
  isActive: z.coerce.boolean(),
  isMold: z.coerce.boolean(),
});

export async function createCategory(prevState: any, formData: FormData) {
  try {
    await requireAdminSession();

    const data = Object.fromEntries(formData.entries());
    const parsed = categorySchema.safeParse(data);

    if (!parsed.success) {
      return { error: "Ошибка валидации" };
    }

    await db.category.create({
      data: {
        name: parsed.data.name,
        displayOrder: parsed.data.displayOrder,
        isActive: true, // По умолчанию активна
        isMold: parsed.data.isMold === true || data.isMold === "on",
      },
    });
    revalidatePath("/admin/categories");
    return { success: true };
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return { error: "Сессия истекла. Войдите снова." };
    }
    return { error: "Ошибка при создании" };
  }
}

export async function updateCategory(id: string, prevState: any, formData: FormData) {
  try {
    await requireAdminSession();

    const data = Object.fromEntries(formData.entries());
    const parsed = categorySchema.safeParse(data);

    if (!parsed.success) return { error: "Ошибка валидации" };

    await db.category.update({
      where: { id },
      data: {
        name: parsed.data.name,
        displayOrder: parsed.data.displayOrder,
        // Checkbox возвращает "on" или ничего, нужно конвертировать
        isActive: data.isActive === "on",
        isMold: data.isMold === "on",
      },
    });
    revalidatePath("/admin/categories");
    return { success: true };
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return { error: "Сессия истекла. Войдите снова." };
    }
    return { error: "Не удалось обновить" };
  }
}

export async function deleteCategory(id: string) {
  try {
    await requireAdminSession();

    await db.category.delete({ where: { id } });
    revalidatePath("/admin/categories");
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      throw e;
    }
    console.error(e);
  }
}
