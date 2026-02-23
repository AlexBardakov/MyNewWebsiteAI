'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// Получить все сертификаты (с опциональным поиском по 6-значному номеру)
export async function getAdminCertificates(searchQuery: string = '') {
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
    await prisma.certificate.update({
      where: { id },
      data: { status: newStatus }
    })
    revalidatePath('/admin/certificates')
    return { success: true }
  } catch (error) {
    console.error("Ошибка обновления статуса:", error)
    return { success: false }
  }
}

// Удалить сертификат
export async function deleteCertificate(id: string) {
  try {
    await prisma.certificate.delete({
      where: { id }
    })
    revalidatePath('/admin/certificates')
    return { success: true }
  } catch (error) {
    console.error("Ошибка удаления:", error)
    return { success: false }
  }
}