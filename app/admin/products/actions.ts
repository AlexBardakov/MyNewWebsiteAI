"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { uploadFile } from "@/lib/upload";

export async function createProduct(prevState: any, formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const priceRub = Number(formData.get("priceRub"));

    // Получаем массив вариантов
    const variantsRaw = formData.getAll("variants") as string[];

    const categoryId = formData.get("categoryId") as string;
    const imageFile = formData.get("image") as File;

    let imageUrl = "";
    if (imageFile && imageFile.size > 0) {
      imageUrl = await uploadFile(imageFile);
    }

    // Подготовка вариантов: убираем лишние пробелы и пустые строки
    const variantsData = variantsRaw
      .map((v) => v.trim())
      .filter((v) => v.length > 0)
      .map((name) => ({ name }));

    await db.product.create({
      data: {
        name,
        priceRub,
        categoryId,
        imageUrl: imageUrl || null,
        description: (formData.get("description") as string) || "",
        unit: (formData.get("unit") as string) || "kg",
        remainder: Number(formData.get("remainder")) || 0,
        avgPackWeightGrams: Number(formData.get("avgPackWeightGrams")) || 0,
        isActive: formData.get("isActive") === "on",

        // Создаем варианты вложенным запросом
        variants: {
          create: variantsData,
        },
      },
    });

    revalidatePath("/admin/products");
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "Ошибка создания товара" };
  }
}

export async function updateProduct(id: string, prevState: any, formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const priceRub = Number(formData.get("priceRub"));

    // Получаем массив вариантов
    const variantsRaw = formData.getAll("variants") as string[];

    const categoryId = formData.get("categoryId") as string;
    const imageFile = formData.get("image") as File;

    // Логика обновления картинки
    let imageUrl = undefined;
    if (imageFile && imageFile.size > 0) {
      imageUrl = await uploadFile(imageFile);
    }

    // Подготовка чистых вариантов
    const validVariants = variantsRaw
      .map((v) => v.trim())
      .filter((v) => v.length > 0);

    // Используем транзакцию, чтобы обновить товар и перезаписать варианты атомарно
    await db.$transaction(async (tx) => {
      // 1. Обновляем основные поля товара
      await tx.product.update({
        where: { id },
        data: {
          name,
          priceRub,
          categoryId,
          ...(imageUrl ? { imageUrl } : {}),
          description: (formData.get("description") as string) || "",
          unit: formData.get("unit") as string,
          remainder: Number(formData.get("remainder")),
          avgPackWeightGrams: Number(formData.get("avgPackWeightGrams")),
          isActive: formData.get("isActive") === "on",
        },
      });

      // 2. Удаляем старые варианты этого товара
      await tx.productVariant.deleteMany({
        where: { productId: id },
      });

      // 3. Если есть новые варианты, создаем их
      if (validVariants.length > 0) {
        await tx.productVariant.createMany({
          data: validVariants.map((name) => ({
            productId: id,
            name,
          })),
        });
      }
    });

    revalidatePath("/admin/products");
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "Ошибка обновления товара" };
  }
}

export async function deleteProduct(id: string) {
  try {
    // Варианты удалятся сами благодаря onDelete: Cascade в схеме Prisma
    await db.product.delete({ where: { id } });
    revalidatePath("/admin/products");
  } catch (e) {
    console.error("Ошибка удаления:", e);
  }
}

export async function updateProductQuantity(id: string, remainder: number) {
  try {
    await db.product.update({
      where: { id },
      data: { remainder },
    });
    revalidatePath("/admin/products");
    return { success: true };
  } catch (e) {
    console.error("Ошибка обновления остатка:", e);
    return { error: "Не удалось обновить остаток" };
  }
}