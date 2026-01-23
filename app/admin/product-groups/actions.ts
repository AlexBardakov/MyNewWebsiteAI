'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Получить все группы с товарами
export async function getProductGroups() {
  const groups = await prisma.productGroup.findMany({
    orderBy: { name: 'asc' },
    include: {
      products: {
        include: {
          product: true
        }
      }
    }
  });
  return groups;
}

// Получить список всех товаров для выбора
export async function getAllProducts() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, name: true, category: { select: { name: true } } },
    orderBy: { name: 'asc' }
  });
  return products;
}

// Создать группу
export async function createProductGroup(data: {
  name: string;
  basePercent: number;
  useInConstructor: boolean;
  productIds: string[];
}) {
  try {
    await prisma.productGroup.create({
      data: {
        name: data.name,
        basePercent: data.basePercent,
        useInConstructor: data.useInConstructor,
        products: {
          create: data.productIds.map((id) => ({
            productId: id
          }))
        }
      },
    });
    revalidatePath('/admin/product-groups');
    revalidatePath('/cheese-plate'); // Обновляем клиентский конструктор
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Ошибка при создании группы' };
  }
}

// Обновить группу
export async function updateProductGroup(id: string, data: {
  name: string;
  basePercent: number;
  useInConstructor: boolean;
  productIds: string[];
}) {
  try {
    // Используем транзакцию: обновляем поля и перезаписываем связи с товарами
    await prisma.$transaction(async (tx) => {
      // 1. Обновляем основные поля
      await tx.productGroup.update({
        where: { id },
        data: {
          name: data.name,
          basePercent: data.basePercent,
          useInConstructor: data.useInConstructor,
        }
      });

      // 2. Обновляем список товаров (удаляем старые связи и создаем новые)
      // Сначала удаляем все связи для этой группы
      await tx.productOnGroup.deleteMany({
        where: { groupId: id }
      });

      // Потом создаем новые
      if (data.productIds.length > 0) {
        await tx.productOnGroup.createMany({
          data: data.productIds.map(prodId => ({
            groupId: id,
            productId: prodId
          }))
        });
      }
    });

    revalidatePath('/admin/product-groups');
    revalidatePath('/cheese-plate');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Ошибка при обновлении группы' };
  }
}

// Удалить группу
export async function deleteProductGroup(id: string) {
  try {
    await prisma.productGroup.delete({ where: { id } });
    revalidatePath('/admin/product-groups');
    revalidatePath('/cheese-plate');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Ошибка при удалении' };
  }
}