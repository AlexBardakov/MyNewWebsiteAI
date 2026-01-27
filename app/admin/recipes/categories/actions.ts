"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createRecipeCategory(formData: FormData) {
  try {
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
    return { success: true };
  } catch (e) {
    return { error: "Ошибка создания категории" };
  }
}

export async function deleteRecipeCategory(id: string) {
  try {
    // 1. Сначала отвязываем рецепты (делаем их "без категории")
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
    return { error: "Не удалось удалить категорию" };
  }
}