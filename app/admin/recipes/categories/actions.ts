"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireAdminSession, UnauthorizedError } from "@/lib/auth-server";

export async function createRecipeCategory(formData: FormData) {
  try {
    await requireAdminSession();

    const name = formData.get("name") as string;
    const displayOrder = parseInt(formData.get("displayOrder") as string || "0");

    await db.recipeCategory.create({
      data: {
        name,
        displayOrder,
        isActive: true,
      },
    });

    revalidatePath("/admin/recipes");
    revalidatePath("/admin/recipes/categories");
    // Мы убрали return, чтобы не было конфликта типов
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      throw e;
    }
    console.error("Ошибка создания категории:", e);
    // И здесь тоже убрали return
  }
}

export async function deleteRecipeCategory(id: string) {
  try {
    await requireAdminSession();

    // 1. Сначала отвязываем рецепты
    await db.recipe.updateMany({
      where: { categoryId: id },
      data: { categoryId: null },
    });

    // 2. Удаляем категорию
    await db.recipeCategory.delete({
      where: { id },
    });

    revalidatePath("/admin/recipes");
    revalidatePath("/admin/recipes/categories");
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      throw e;
    }
    console.error("Не удалось удалить категорию:", e);
  }
}
