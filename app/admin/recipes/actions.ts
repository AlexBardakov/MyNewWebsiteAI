// app/admin/recipes/actions.ts
"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { uploadFile } from "@/lib/upload";

export async function createRecipe(prevState: any, formData: FormData) {
  try {
    const title = formData.get("title") as string;
    const categoryId = formData.get("categoryId") as string;
    const content = formData.get("content") as string;

    // Обработка товаров (массив ID)
    // В форме это будет мульти-селект, который передаст несколько значений с одним именем "productIds"
    const productIds = formData.getAll("productIds") as string[];

    // Картинка
    const imageFile = formData.get("image") as File;
    let coverUrl = "";
    if (imageFile && imageFile.size > 0) {
      coverUrl = await uploadFile(imageFile);
    }

    await db.recipe.create({
      data: {
        title,
        categoryId: categoryId || null, // Может быть без категории
        content,
        coverUrl: coverUrl || null,
        ingredientsText: formData.get("ingredientsText") as string,
        isActive: formData.get("isActive") === "on",

        // Создаем связи с товарами
        recipeProducts: {
          create: productIds.map(pId => ({
            productId: pId
          }))
        }
      },
    });

    revalidatePath("/admin/recipes");
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "Ошибка создания рецепта" };
  }
}

export async function deleteRecipe(id: string) {
  try {
    // Сначала удаляем связи, хотя cascade должен сработать, но для надежности:
    await db.recipeProduct.deleteMany({ where: { recipeId: id }});
    await db.recipe.delete({ where: { id } });
    revalidatePath("/admin/recipes");
  } catch (e) {
      console.error(e);
  }
}