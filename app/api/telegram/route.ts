// app/api/telegram/route.ts
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import axios from 'axios'
import { SocksProxyAgent } from 'socks-proxy-agent'

const proxyUrl = process.env.TELEGRAM_PROXY;
const httpsAgent = proxyUrl ? new SocksProxyAgent(proxyUrl) : undefined;

// Вспомогательная функция для быстрой отправки сообщений
async function replyToTelegram(chatId: number, text: string, replyMarkup?: any) {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
  if (!BOT_TOKEN) return

  try {
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML',
      reply_markup: replyMarkup
    }, { httpsAgent })
  } catch (e) {
    console.error("❌ Ошибка отправки replyToTelegram:", e)
  }
}

export async function POST(req: Request) {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
  if (!BOT_TOKEN) {
    console.error('❌ Ошибка: Токен Телеграм отсутствует!')
    return NextResponse.json({ ok: false })
  }

  try {
    const body = await req.json()
    console.log('📥 Входящий вебхук от TG:', JSON.stringify(body, null, 2))

    // 1. ЕСЛИ ЭТО ОБЫЧНОЕ СООБЩЕНИЕ (/check 123456)
    if (body.message && body.message.text) {
      const text = body.message.text.trim()
      const chatId = body.message.chat.id
      const match = text.match(/(?:^|\/check\s+)(\d{6})$/)

      if (match) {
        const shortNumber = match[1]
        console.log(`🔍 Запрос на проверку сертификата: ${shortNumber}`)

        const cert = await prisma.certificate.findUnique({ where: { shortNumber } })

        if (!cert) {
          await replyToTelegram(chatId, `❌ Сертификат с номером <b>${shortNumber}</b> не найден.`)
          return NextResponse.json({ ok: true })
        }

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

    // 2. ЕСЛИ ЭТО НАЖАТИЕ НА КНОПКУ
    if (body.callback_query) {
      const callbackData = body.callback_query.data
      const callbackQueryId = body.callback_query.id
      const chatId = body.callback_query.message?.chat?.id
      const messageId = body.callback_query.message?.message_id

      console.log(`🔘 Нажата кнопка! Data: ${callbackData}, MsgID: ${messageId}`)

      if (callbackData && callbackData.startsWith('use_')) {
        const certId = callbackData.replace('use_', '')

        // ШАГ 1: МГНОВЕННО отвечаем Телеграму
        axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
          callback_query_id: callbackQueryId,
          text: 'Обрабатываем...',
        }, { httpsAgent }).catch(e => console.error("❌ Ошибка answerCallbackQuery:", e))

        try {
          // ШАГ 2: Гасим сертификат в БД
          const updatedCert = await prisma.certificate.update({
            where: { id: certId },
            data: { status: 'USED' }
          })

          console.log(`✅ Сертификат ${updatedCert.shortNumber} успешно погашен в БД!`)

          // ШАГ 3: Обновляем текст сообщения, убирая кнопку
          if (chatId && messageId) {
            await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
              chat_id: chatId,
              message_id: messageId,
              text: `✅ <b>Сертификат №${updatedCert.shortNumber} успешно погашен!</b>\nСумма: ${updatedCert.amount} руб.`,
              parse_mode: 'HTML'
            }, { httpsAgent })
          }

        } catch (error) {
          console.error('❌ Ошибка при обновлении БД:', error)
          // Ошибка всплывающим окном
          await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
            callback_query_id: callbackQueryId,
            text: 'Ошибка БД. Сертификат не найден или уже погашен.',
            show_alert: true
          }, { httpsAgent })
        }
      } else {
        console.log('⚠️ Неизвестная команда кнопки:', callbackData)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('❌ Критическая Ошибка парсинга Webhook:', error)
    return NextResponse.json({ ok: false })
  }
}