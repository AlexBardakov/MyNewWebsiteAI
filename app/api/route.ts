import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Убедись, что токен совпадает с тем, что в lib/telegram.ts
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

// Функция для отправки ответа обратно в Телеграм
async function replyToTelegram(chatId: number, text: string, replyMarkup?: any) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML',
      reply_markup: replyMarkup
    })
  })
}

// Обработчик входящих сообщений от Telegram
export async function POST(req: Request) {
  try {
    const body = await req.json()

    // 1. ЕСЛИ ЭТО ОБЫЧНОЕ СООБЩЕНИЕ
    if (body.message && body.message.text) {
      const text = body.message.text.trim()
      const chatId = body.message.chat.id

      // Бот реагирует на команду вида "/check 123456" или просто 6 цифр
      const match = text.match(/(?:^|\/check\s+)(\d{6})$/)

      if (match) {
        const shortNumber = match[1]

        // Ищем сертификат в базе
        const cert = await prisma.certificate.findUnique({
          where: { shortNumber }
        })

        if (!cert) {
          await replyToTelegram(chatId, `❌ Сертификат с номером <b>${shortNumber}</b> не найден.`)
          return NextResponse.json({ ok: true })
        }

        // Переводим статусы на русский
        const statusMap: Record<string, string> = {
          'PENDING': '🟡 Ожидает оплаты',
          'PAID': '🟢 Оплачен',
          'SENT': '🔵 Отправлен',
          'USED': '⚪️ Использован (ПОГАШЕН)'
        }

        let responseText = `
🧾 <b>Сертификат №${cert.shortNumber}</b>
Статус: ${statusMap[cert.status] || cert.status}
Номинал: <b>${cert.amount} руб.</b>
От кого: ${cert.senderName}
Кому: ${cert.recipientName}
        `

        // Если сертификат можно использовать (он оплачен или отправлен), добавляем кнопку
        let replyMarkup = undefined
        if (cert.status === 'PAID' || cert.status === 'SENT') {
          replyMarkup = {
            inline_keyboard: [[
              { text: "✅ Использовать (Погасить)", callback_data: `use_${cert.id}` }
            ]]
          }
        }

        await replyToTelegram(chatId, responseText, replyMarkup)
      }
    }

    // 2. ЕСЛИ ЭТО НАЖАТИЕ НА КНОПКУ (Callback Query)
    if (body.callback_query) {
      const callbackData = body.callback_query.data
      const chatId = body.callback_query.message.chat.id
      const messageId = body.callback_query.message.message_id

      if (callbackData.startsWith('use_')) {
        const certId = callbackData.replace('use_', '')

        // Гасим сертификат в базе
        const updatedCert = await prisma.certificate.update({
          where: { id: certId },
          data: { status: 'USED' }
        })

        // Меняем сообщение с кнопкой на текст об успешном гашении
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            message_id: messageId,
            text: `✅ <b>Сертификат №${updatedCert.shortNumber} успешно погашен!</b>\nСумма: ${updatedCert.amount} руб.`,
            parse_mode: 'HTML'
          })
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Ошибка Webhook Telegram:', error)
    return NextResponse.json({ ok: false })
  }
}