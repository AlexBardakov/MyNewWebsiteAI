'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireAdminSession, UnauthorizedError } from "@/lib/auth-server";

// Получить все сертификаты (с опциональным поиском по 6-значному номеру).
// Содержит ПДн отправителей/получателей — обязательно за стражем.
export async function getAdminCertificates(searchQuery: string = '') {
  // Защищаем чтение — это персональные данные клиентов.
  await requireAdminSession();

  return await prisma.certificate.findMany({
    where: {
      shortNumber: {
        contains: searchQuery,
      }
    },
    orderBy: {
      createdAt: 'desc' // Новые сверху
    }
  })
}

// Обновить статус сертификата
export async function updateCertificateStatus(id: string, newStatus: string) {
  try {
    await requireAdminSession();

    await prisma.certificate.update({
      where: { id },
      data: { status: newStatus }
    })
    revalidatePath('/admin/certificates')
    return { success: true }
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: "Сессия истекла. Войдите снова." }
    }
    console.error("Ошибка обновления статуса:", error)
    return { success: false }
  }
}

// Удалить сертификат
export async function deleteCertificate(id: string) {
  try {
    await requireAdminSession();

    await prisma.certificate.delete({
      where: { id }
    })
    revalidatePath('/admin/certificates')
    return { success: true }
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: "Сессия истекла. Войдите снова." }
    }
    console.error("Ошибка удаления:", error)
    return { success: false }
  }
}
