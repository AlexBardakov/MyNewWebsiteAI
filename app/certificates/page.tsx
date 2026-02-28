'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createCertificate } from '@/actions/certificates'
import { Playfair_Display } from 'next/font/google'
import Link from 'next/link'

const playfair = Playfair_Display({
  subsets: ['cyrillic', 'latin'],
  weight: ['400'],
  style: ['normal']
})

export default function BuyCertificatePage() {
  const [loading, setLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false) // Новое состояние для успешной отправки

  const [recipientName, setRecipientName] = useState('')
  const [amount, setAmount] = useState('1500')
  const [senderName, setSenderName] = useState('')
  const [message, setMessage] = useState('')
  const [senderContact, setSenderContact] = useState('')
  const [recipientContact, setRecipientContact] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const result = await createCertificate({
      recipientName,
      amount: parseInt(amount),
      senderName,
      message,
      senderContact,
      recipientContact
    })

    if (result.success && result.certificate) {
      // Вместо редиректа просто показываем экран успеха
      setIsSuccess(true)
      setLoading(false)
    } else {
      alert('Произошла ошибка при создании сертификата')
      setLoading(false)
    }
  }

  const amountOptions = Array.from({ length: 10 }, (_, i) => (i + 1) * 500)

  // Если сертификат успешно создан, показываем только сообщение
  if (isSuccess) {
    return (
      <div className="container mx-auto max-w-2xl py-20 px-4 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold mb-4 text-gray-800">Сертификат успешно создан!</h2>
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            Мы свяжемся с Вами в ближайшее время по указанному номеру для оплаты и отправки сертификата получателю.
            <br/><br/>
            Спасибо Вам за доверие!
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => {
                setIsSuccess(false)
                setRecipientName('')
                setSenderName('')
                setMessage('')
                // Оставляем контакты, вдруг человек хочет сделать еще один сертификат себе же
              }}
              className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition"
            >
              Создать еще один
            </button>
            <Link
              href="/"
              className="px-6 py-3 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition"
            >
              Вернуться на главную
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-6xl py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">Оформление подарочного сертификата</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

        {/* ЛЕВАЯ КОЛОНКА: Форма ввода */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="block text-sm font-medium mb-1">Кому *</label>
              <input
                type="text" required
                placeholder="Укажите получателя"
                className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Сумма сертификата *</label>
              <select
                className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              >
                {amountOptions.map(val => (
                  <option key={val} value={val}>{val} рублей</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">От кого *</label>
              <input
                type="text" required
                placeholder="Укажите отправителя"
                className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Пожелания</label>
              <textarea
                rows={3}
                placeholder="Введите пожелания для получателя или оставьте поле пустым"
                className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <div className="pt-4 border-t border-gray-100">
              <label className="block text-sm font-medium mb-1">Номер телефона отправителя *</label>
              <input
                type="tel" required
                placeholder="+7 (___) ___-__-__"
                className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                value={senderContact}
                onChange={(e) => setSenderContact(e.target.value)}
              />
              <p className="text-xs text-gray-400 mt-1">Для связи по вопросам оплаты и отправки</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Кому отправить *</label>
              <input
                type="text" required
                placeholder="Email или телефон получателя"
                className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                value={recipientContact}
                onChange={(e) => setRecipientContact(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-600 text-white font-bold py-4 rounded-lg hover:bg-amber-700 transition disabled:opacity-50 mt-4"
            >
              {loading ? 'Создаем...' : 'Создать сертификат'}
            </button>
          </form>
        </div>

        {/* ПРАВАЯ КОЛОНКА: Живое превью */}
        <div className="flex flex-col items-center">
          <h3 className="text-lg font-medium mb-4 text-gray-700 w-full text-left lg:text-center">Предварительный просмотр:</h3>

          <div
            className={`relative w-full max-w-sm mx-auto overflow-hidden ${playfair.className}`}
            style={{ containerType: 'inline-size' }}
          >
            <Image
              src="/certificate-bg.webp"
              alt="Фон сертификата"
              width={1632}
              height={2450}
              className="w-full h-auto rounded-xl shadow-lg border border-gray-200"
              priority
            />

            {/* Кому */}
            <div className="absolute flex items-center justify-center text-center"
              style={{
                top: '37%', left: '15%', width: '80%',
                color: '#333333', fontSize: '4.5cqw', fontWeight: '400',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word'
              }}
            >
              {recipientName || 'Имя получателя'}
            </div>

            {/* Сумма */}
            <div className="absolute flex items-center justify-center text-center"
              style={{
                top: '45.5%', left: '10%', width: '80%',
                color: '#333333', fontSize: '5cqw', fontWeight: '400',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word'
              }}
            >
              {amount}
            </div>

            {/* От кого */}
            <div className="absolute flex items-center justify-center text-center"
              style={{
                top: '76%', left: '22.5%', width: '70%',
                color: '#333333', fontSize: '3.8cqw', fontWeight: '400',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word'
              }}
            >
              {senderName || 'Имя отправителя'}
            </div>

            {/* Пожелания */}
            <div className="absolute flex items-start justify-center text-center"
              style={{
                top: '64%', left: '10%', width: '80%', height: '20%',
                color: '#333333', fontSize: '4cqw', fontWeight: '400',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflow: 'hidden'
              }}
            >
              {message || 'Здесь будут ваши искренние пожелания'}
            </div>

            {/* Номер сертификата */}
            <div className="absolute flex items-center justify-end text-right"
              style={{
                bottom: '8.5%', right: '25%', width: '40%',
                color: '#333333', fontSize: '3cqw', fontWeight: '400',
                whiteSpace: 'nowrap'
              }}
            >
              {/* Тут я убрал XXXXXX, чтобы оно не мозолило глаза до создания,
                  но если хочешь, можешь вернуть назад */}
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}