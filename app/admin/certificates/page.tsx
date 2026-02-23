'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  getAdminCertificates,
  updateCertificateStatus,
  deleteCertificate
} from './actions'

// Тип для подсказок TS
type Certificate = Awaited<ReturnType<typeof getAdminCertificates>>[0]

export default function AdminCertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [certToSend, setCertToSend] = useState<Certificate | null>(null)

  // Загрузка данных
  const fetchCertificates = async () => {
    setLoading(true)
    const data = await getAdminCertificates(search)
    setCertificates(data)
    setLoading(false)
  }

  // Загружаем при монтировании и при изменении строки поиска (с небольшой задержкой можно было бы, но пока напрямую)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCertificates()
    }, 300) // Задержка, чтобы не спамить запросами при быстром наборе текста
    return () => clearTimeout(delayDebounceFn)
  }, [search])

  // Обработчики кнопок
  const handleStatusChange = async (id: string, status: string) => {
    // Словарь для красивых текстов в окне подтверждения
    const actionNames: Record<string, string> = {
      'PAID': 'подтвердить оплату',
      'SENT': 'отметить как отправленный',
      'USED': 'отметить как использованный (погашенный)'
    }

    const actionName = actionNames[status] || 'изменить статус'

    if (confirm(`Вы уверены, что хотите ${actionName} для этого сертификата?`)) {
      const res = await updateCertificateStatus(id, status)
      if (res.success) fetchCertificates()
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Вы уверены, что хотите удалить этот сертификат?')) {
      const res = await deleteCertificate(id)
      if (res.success) fetchCertificates()
    }
  }

  // Функция для красивого отображения статусов
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Ожидает оплаты</Badge>
      case 'PAID': return <Badge variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-100">Оплачен</Badge>
      case 'SENT': return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Отправлен</Badge>
      case 'USED': return <Badge variant="outline" className="text-gray-500">Использован</Badge>
      default: return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Управление сертификатами</h1>
      </div>

      <div className="flex items-center space-x-2 w-full max-w-sm">
        <Input
          placeholder="Поиск по 6-значному номеру..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="border rounded-md bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Номер</TableHead>
              <TableHead>Дата создания</TableHead>
              <TableHead>Сумма</TableHead>
              <TableHead>Контакты</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                  Загрузка...
                </TableCell>
              </TableRow>
            ) : certificates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                  Сертификаты не найдены
                </TableCell>
              </TableRow>
            ) : (
              certificates.map((cert) => (
                <TableRow
                  key={cert.id}
                  // Если сертификат использован, делаем строку заметно бледной
                  className={cert.status === 'USED' ? 'opacity-50 bg-gray-50/50' : ''}
                >
                  <TableCell className="font-medium text-lg">
                    {cert.shortNumber}
                  </TableCell>
                  <TableCell>
                    {new Date(cert.createdAt).toLocaleDateString('ru-RU', {
                      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit'
                    })}
                  </TableCell>
                  <TableCell className="font-semibold">{cert.amount} ₽</TableCell>
                  <TableCell className="text-sm">
                    <div><span className="text-gray-500">От:</span> {cert.senderContact}</div>
                    <div><span className="text-gray-500">Кому:</span> {cert.recipientContact}</div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(cert.status)}
                  </TableCell>
                  <TableCell className="text-right space-x-2 space-y-2">
                    {/* Кнопка предпросмотра (открывается в новой вкладке) */}
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/certificates/${cert.accessCode}`} target="_blank">
                        Смотреть
                      </Link>
                    </Button>

                    {/* Логика отображения кнопок в зависимости от статуса */}
                    {cert.status === 'PENDING' && (
                      <>
                        <Button variant="default" size="sm" onClick={() => handleStatusChange(cert.id, 'PAID')}>
                          Подтвердить оплату
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(cert.id)}>
                          Удалить
                        </Button>
                      </>
                    )}

                    {cert.status === 'PAID' && (
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => setCertToSend(cert)}
                      >
                        Отправить
                      </Button>
                    )}

                    {(cert.status === 'PAID' || cert.status === 'SENT') && (
                      <Button variant="secondary" size="sm" onClick={() => handleStatusChange(cert.id, 'USED')}>
                        Использован
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <Dialog open={!!certToSend} onOpenChange={(open) => !open && setCertToSend(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Отправка сертификата клиенту</DialogTitle>
              <DialogDescription>
                Скопируйте этот текст и отправьте его получателю в WhatsApp, Telegram или на Email.
              </DialogDescription>
            </DialogHeader>

            <div className="bg-muted p-4 rounded-md text-sm whitespace-pre-wrap font-mono">
              Здравствуйте! 🧀

              Вам подарили сертификат в сыроварню "Four Kings" на сумму {certToSend?.amount} рублей!

              От кого: {certToSend?.senderName}
              {certToSend?.message ? `Пожелание: ${certToSend.message}\n` : ''}

              Номер сертификата: {certToSend?.shortNumber}, запомните его.

              Посмотреть и сохранить ваш сертификат можно по этой уникальной ссылке:
              https://fourkings.ru/certificates/{certToSend?.accessCode}

              Ждем вас за вкусным сыром!
            </div>

            <DialogFooter className="sm:justify-between flex-row">
              <Button
                variant="outline"
                onClick={() => {
                  // Копируем текст в буфер обмена
                  const text = `Здравствуйте! 🧀\n\nВам подарили сертификат в сыроварню "Four Kings" на сумму ${certToSend?.amount} рублей!\n\nОт кого: ${certToSend?.senderName}\n${certToSend?.message ? `Пожелание: ${certToSend.message}\n` : ''}\nНомер сертификата: {certToSend?.shortNumber}, запомните его.\nПосмотреть и сохранить ваш сертификат можно по этой уникальной ссылке:\nhttps://fourkings.ru/certificates/${certToSend?.accessCode}\n\nЖдем вас за вкусным сыром!`
                  navigator.clipboard.writeText(text)
                  alert('Текст скопирован в буфер обмена!')
                }}
              >
                Скопировать текст
              </Button>
              <Button
                variant="default"
                onClick={() => {
                  if (certToSend) {
                    handleStatusChange(certToSend.id, 'SENT')
                    setCertToSend(null)
                  }
                }}
              >
                Статус: Отправлен
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  )
}