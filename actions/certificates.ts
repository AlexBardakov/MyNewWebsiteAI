'use server'

import { prisma } from '@/lib/prisma'

// Генерация 6-значного номера (только цифры)
function generateShortNumber() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Генерация 20-значного кода (буквы и цифры)
function generateAccessCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 20; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function createCertificate(data: {
  recipientName: string
  amount: number
  senderName: string
  message: string
  senderContact: string
  recipientContact: string
}) {
  try {
    let shortNumber = generateShortNumber()

    // Проверяем, нет ли уже такого 6-значного номера в базе
    let existingShort = await prisma.certificate.findUnique({
      where: { shortNumber }
    })

    // Если вдруг совпало, генерируем заново
    while (existingShort) {
      shortNumber = generateShortNumber()
      existingShort = await prisma.certificate.findUnique({
        where: { shortNumber }
      })
    }

    const accessCode = generateAccessCode()

    // Создаем запись в БД с НОВЫМИ полями
    const certificate = await prisma.certificate.create({
      data: {
        shortNumber,
        accessCode,
        recipientName: data.recipientName,
        amount: data.amount,
        senderName: data.senderName,
        message: data.message,
        senderContact: data.senderContact,
        recipientContact: data.recipientContact,
      }
    })

    return { success: true, certificate }
  } catch (error) {
    console.error("Ошибка при создании сертификата:", error)
    return { success: false, error: "Не удалось создать сертификат" }
  }
}