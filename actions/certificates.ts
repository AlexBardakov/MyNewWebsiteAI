'use server'

import { randomInt } from 'crypto'
import { prisma } from '@/lib/prisma'
import { notifyNewCertificate } from '@/lib/notify'

/** Ограничения полей. Имена и пожелание печатаются на картинке сертификата — длинный текст не влезет. */
// (не export: из 'use server'-файла можно экспортировать только async-функции)
const CERT_LIMITS = { name: 60, contact: 100, message: 300 } as const
/** Номиналы — как в форме app/certificates/page.tsx: 500, 1000 … 5000 ₽. */
const AMOUNTS = new Set(Array.from({ length: 10 }, (_, i) => (i + 1) * 500))

// 6-значный номер (только цифры) — криптостойкий генератор, а не Math.random.
function generateShortNumber() {
  return String(randomInt(100000, 1000000))
}

// 20-значный код доступа к странице сертификата (буквы и цифры). Это фактически пароль
// к сертификату, поэтому — криптостойкий генератор (Math.random предсказуем).
function generateAccessCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 20; i++) result += chars[randomInt(chars.length)]
  return result
}

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

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
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    // СЕРВЕРНАЯ ВАЛИДАЦИЯ СОГЛАСИЙ.
    // Если клиентская проверка обойдена (DevTools, прямой вызов action) — сервер откажет.
    if (!data?.consent?.self || !data?.consent?.recipient) {
      return {
        success: false,
        error: 'Для оформления сертификата необходимо подтвердить оба согласия (на обработку Ваших данных и наличие согласия получателя).',
      }
    }

    // Серверная проверка полей: форму можно обойти и прислать что угодно
    // (например, номинал 0 или 1 000 000 ₽).
    const amount = Number(data.amount)
    if (!AMOUNTS.has(amount)) return { success: false, error: 'Выберите номинал от 500 до 5000 ₽' }
    const recipientName = clean(data.recipientName, CERT_LIMITS.name)
    const senderName = clean(data.senderName, CERT_LIMITS.name)
    const senderContact = clean(data.senderContact, CERT_LIMITS.contact)
    const recipientContact = clean(data.recipientContact, CERT_LIMITS.contact)
    const message = clean(data.message, CERT_LIMITS.message)
    if (!recipientName || !senderName) return { success: false, error: 'Укажите, от кого и кому сертификат' }
    if (senderContact.length < 5 || recipientContact.length < 5) return { success: false, error: 'Проверьте контакты' }

    // Уникальный 6-значный номер (на случай совпадения — генерируем заново).
    let shortNumber = generateShortNumber()
    while (await prisma.certificate.findUnique({ where: { shortNumber } })) {
      shortNumber = generateShortNumber()
    }

    // consentAcceptedAt — момент двойного подтверждения отправителя
    // (152-ФЗ ст. 9 ч. 4 + Политика п. 8.3), только после успешной проверки выше.
    const certificate = await prisma.certificate.create({
      data: {
        shortNumber,
        accessCode: generateAccessCode(),
        recipientName,
        amount,
        senderName,
        message,
        senderContact,
        recipientContact,
        consentAcceptedAt: new Date(),
      }
    })

    // ОБЕЗЛИЧЕННОЕ уведомление администраторам (ВКонтакте + журнал приложения) В ФОНЕ.
    notifyNewCertificate({
      id: certificate.id,
      shortNumber,
      amount: certificate.amount,
    }).catch((e) => console.error('Ошибка фоновой отправки уведомления о сертификате:', e));

    // В браузер — только «успешно». Раньше сюда уходил весь сертификат вместе с кодом
    // доступа (accessCode) — по нему можно было открыть сертификат ещё ДО оплаты.
    return { success: true }
  } catch (error) {
    console.error("Ошибка при создании сертификата:", error)
    return { success: false, error: "Не удалось создать сертификат" }
  }
}
