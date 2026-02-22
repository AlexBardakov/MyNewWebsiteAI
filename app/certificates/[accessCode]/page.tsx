import { notFound } from 'next/navigation'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { Playfair_Display } from 'next/font/google'

const playfair = Playfair_Display({
  subsets: ['cyrillic', 'latin'],
  weight: ['400'],
  style: ['normal']
})

// Обновленная типизация: params теперь это Promise
interface PageProps {
  params: Promise<{
    accessCode: string
  }>
}

export default async function CertificatePage({ params }: PageProps) {
  // Дожидаемся распаковки параметров
  const resolvedParams = await params

  // Ищем сертификат в базе данных по 20-значному коду из URL
  const certificate = await prisma.certificate.findUnique({
    where: {
      accessCode: resolvedParams.accessCode
    }
  })

  // Если сертификат не найден или кто-то ввел случайный код — показываем 404
  if (!certificate) {
    notFound()
  }

  return (
    <div className="container mx-auto py-12 px-4 flex flex-col items-center min-h-screen bg-gray-50">
      <h1 className="text-2xl md:text-3xl font-bold mb-8 text-center text-gray-800">
        Подарочный сертификат
      </h1>

      <div
        className={`relative w-full max-w-2xl mx-auto overflow-hidden rounded-xl shadow-2xl border border-gray-200 ${playfair.className}`}
        style={{ containerType: 'inline-size' }}
      >
        <Image
          src="/certificate-bg.png"
          alt="Подарочный сертификат"
          width={1632}
          height={2450}
          className="w-full h-auto"
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
          {certificate.recipientName}
        </div>

        {/* Сумма */}
        <div className="absolute flex items-center justify-center text-center"
          style={{
            top: '45.5%', left: '10%', width: '80%',
            color: '#333333', fontSize: '5cqw', fontWeight: '400',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word'
          }}
        >
          {certificate.amount}
        </div>

        {/* От кого */}
        <div className="absolute flex items-center justify-center text-center"
          style={{
            top: '76%', left: '22.5%', width: '70%',
            color: '#333333', fontSize: '3.8cqw', fontWeight: '400',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word'
          }}
        >
          {certificate.senderName}
        </div>

        {/* Пожелания */}
        <div className="absolute flex items-start justify-center text-center"
          style={{
            top: '64%', left: '10%', width: '80%', height: '20%',
            color: '#333333', fontSize: '4cqw', fontWeight: '400',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflow: 'hidden'
          }}
        >
          {certificate.message}
        </div>

        {/* Номер сертификата */}
        <div className="absolute flex items-center justify-end text-right"
          style={{
            bottom: '8.5%', right: '26.5%', width: '40%',
            color: '#333333', fontSize: '3.5cqw', fontWeight: '400',
            whiteSpace: 'nowrap'
          }}
        >
          {certificate.shortNumber}
        </div>
      </div>

      {/* Подсказка для пользователя */}
      <div className="mt-8 text-center text-gray-500 max-w-md">
        <p>Вы можете сохранить ссылку на эту страницу или сделать скриншот, чтобы отправить сертификат.</p>
      </div>
    </div>
  )
}