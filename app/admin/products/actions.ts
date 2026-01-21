"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { uploadFile } from "@/lib/upload";

export async function createProduct(prevState: any, formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const priceRub = Number(formData.get("priceRub"));
    const categoryId = formData.get("categoryId") as string;
    const imageFile = formData.get("image") as File;

    let imageUrl = "";
    if (imageFile && imageFile.size > 0) {
      imageUrl = await uploadFile(imageFile);
    }

    await db.product.create({
      data: {
        name,
        priceRub,
        categoryId,
        imageUrl: imageUrl || null,
        description: formData.get("description") as string,
        unit: formData.get("unit") as string || "kg",
        remainder: Number(formData.get("remainder")) || 0,
        avgPackWeightGrams: Number(formData.get("avgPackWeightGrams")) || 0,
        isActive: formData.get("isActive") === "on",
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
    const categoryId = formData.get("categoryId") as string;
    const imageFile = formData.get("image") as File;

    // Логика обновления картинки:
    // Если файл загрузили — обновляем путь. Если нет — оставляем старый (undefined не обновит поле)
    let imageUrl = undefined;
    if (imageFile && imageFile.size > 0) {
      imageUrl = await uploadFile(imageFile);
    }

    await db.product.update({
      where: { id },
      data: {
        name,
        priceRub,
        categoryId,
        ...(imageUrl ? { imageUrl } : {}), // Обновляем только если есть новая
        description: formData.get("description") as string,
        unit: formData.get("unit") as string,
        remainder: Number(formData.get("remainder")),
        avgPackWeightGrams: Number(formData.get("avgPackWeightGrams")),
        isActive: formData.get("isActive") === "on",
      },
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
    await db.product.delete({ where: { id } });
    revalidatePath("/admin/products");
  } catch (e) {
    console.error("Ошибка удаления:", e);
  }
}