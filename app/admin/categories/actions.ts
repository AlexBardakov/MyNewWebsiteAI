"use server";

import { db } from "@/lib/db"; // Убедитесь, что у вас есть этот файл (или prisma.ts)
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Схема валидации
const categorySchema = z.object({
  name: z.string().min(1, "Название обязательно"),
  displayOrder: z.coerce.number().default(0),
  isActive: z.coerce.boolean(),
  isMold: z.coerce.boolean(),
});

export async function createCategory(prevState: any, formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  const parsed = categorySchema.safeParse(data);

  if (!parsed.success) {
    return { error: "Ошибка валидации" };
  }

  try {
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
    return { error: "Ошибка при создании" };
  }
}

export async function updateCategory(id: string, prevState: any, formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  const parsed = categorySchema.safeParse(data);

  if (!parsed.success) return { error: "Ошибка валидации" };

  try {
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
    return { error: "Не удалось обновить" };
  }
}

export async function deleteCategory(id: string) {
  try {
    await db.category.delete({ where: { id } });
    revalidatePath("/admin/categories");
  } catch (e) {
    console.error(e);
  }
}