'use server'

import { prisma } from '@/lib/prisma'
import { sendTelegramCertificateNotification } from '@/lib/telegram'

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
  /**
   * Подтверждения согласий (152-ФЗ ст. 9 ч. 4 + Политика п. 8.3).
   * Без обоих true сертификат не создаётся.
   * Проверяется на сервере, дублирует клиентскую валидацию из app/certificates/page.tsx.
   */
  consent: {
    self: boolean       // согласие отправителя на свои ПДн + акцепт оферты
    recipient: boolean  // подтверждение согласия получателя на предоставление его данных
  }
}) {
  try {
    // СЕРВЕРНАЯ ВАЛИДАЦИЯ СОГЛАСИЙ.
    // Если клиентская проверка обойдена (DevTools, прямой вызов action) — сервер откажет.
    if (!data.consent?.self || !data.consent?.recipient) {
      return {
        success: false,
        error: 'Для оформления сертификата необходимо подтвердить оба согласия (на обработку Ваших данных и наличие согласия получателя).',
      }
    }

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

    // Создаём запись в БД.
    // consentAcceptedAt фиксирует момент двойного подтверждения отправителя
    // (152-ФЗ ст. 9 ч. 4 + Политика п. 8.3). Проставляется только после
    // успешной серверной валидации в начале функции.
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
        consentAcceptedAt: new Date(),
      }
    })

    // ОБЕЗЛИЧЕННОЕ уведомление в Telegram (без ПДн отправителя/получателя).
    // Подробности и ссылки на конкретного отправителя/получателя — только в админке.
    // См. lib/telegram.ts и docs/privacy-draft.md, раздел 7.3.
    sendTelegramCertificateNotification({
      shortNumber,
      dbId: certificate.id,
      amount: data.amount,
    }).catch(console.error);

    return { success: true, certificate }
  } catch (error) {
    console.error("Ошибка при создании сертификата:", error)
    return { success: false, error: "Не удалось создать сертификат" }
  }
}