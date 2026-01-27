"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { uploadFile } from "@/lib/upload";

export async function createRecipe(prevState: any, formData: FormData) {
  try {
    const title = formData.get("title") as string;
    const categoryId = formData.get("categoryId") as string;
    const content = formData.get("content") as string;
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
        categoryId: categoryId || null,
        content,
        coverUrl: coverUrl || null,
        ingredientsText: formData.get("ingredientsText") as string,
        isActive: formData.get("isActive") === "on",
        recipeProducts: {
          create: productIds.map(pId => ({ productId: pId }))
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

// НОВАЯ ФУНКЦИЯ ОБНОВЛЕНИЯ
export async function updateRecipe(id: string, prevState: any, formData: FormData) {
    try {
      const title = formData.get("title") as string;
      const categoryId = formData.get("categoryId") as string;
      const content = formData.get("content") as string;
      const productIds = formData.getAll("productIds") as string[];

      const imageFile = formData.get("image") as File;
      let coverUrl = undefined; // undefined = не обновлять поле
      if (imageFile && imageFile.size > 0) {
        coverUrl = await uploadFile(imageFile);
      }

      // 1. Обновляем основные поля
      await db.recipe.update({
        where: { id },
        data: {
          title,
          categoryId: categoryId || null,
          content,
          ...(coverUrl && { coverUrl }), // Обновляем фото только если загружено новое
          ingredientsText: formData.get("ingredientsText") as string,
          isActive: formData.get("isActive") === "on",
        },
      });

      // 2. Обновляем связи с товарами (удаляем старые, создаем новые)
      // Это самый простой способ синхронизировать many-to-many без сложной логики diff
      await db.recipeProduct.deleteMany({ where: { recipeId: id } });
      if (productIds.length > 0) {
          await db.recipeProduct.createMany({
              data: productIds.map(pId => ({
                  recipeId: id,
                  productId: pId
              }))
          });
      }

      revalidatePath("/admin/recipes");
      return { success: true };
    } catch (e) {
      console.error(e);
      return { error: "Ошибка обновления рецепта" };
    }
  }

export async function deleteRecipe(id: string) {
  try {
    await db.recipeProduct.deleteMany({ where: { recipeId: id }});
    await db.recipe.delete({ where: { id } });
    revalidatePath("/admin/recipes");
  } catch (e) {
      console.error(e);
  }
}