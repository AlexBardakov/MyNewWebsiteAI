# API Android-приложения админа

Базовый адрес: `https://fourkings.ru/api/app`. Обмен — JSON (UTF-8), только HTTPS.
Код приложения — папка `android/` этого репозитория.

## Авторизация

1. Приложение входит паролем админки — `POST /login`, получает **ключ устройства** (`token`).
2. Каждый следующий запрос несёт заголовок `Authorization: Bearer <token>`.
3. Ключ бессрочный, пока устройство не отключено в веб-админке (**Приложение: устройства**,
   `/admin/devices`) или приложение не вышло само (`POST /logout`).
4. Ответ `401` на любой запрос = ключ больше не действует → приложение показывает экран входа.

В базе хранится только sha256 от ключа (`AppDevice.tokenHash`).

## Методы

### `POST /login`
Тело: `{ "password": "…", "deviceName": "Xiaomi 13" }`
- `200` → `{ "token": "…", "deviceId": "…", "cursor": 17 }` — `cursor` = номер последнего события на
  сервере: новое устройство начинает с него и не получает уведомлений о старых заказах.
- `401` `wrong_password`; `429` `too_many_attempts` — больше 5 неудачных попыток за 15 минут
  с одного адреса (заголовок `Retry-After` — сколько секунд ждать).

### `POST /logout`
Отзывает ключ текущего устройства. → `{ "ok": true }`

### `GET /events?after=N`
Новые события после события №N, по возрастанию, не больше 50 за раз.
```json
{ "events": [ { "id": 18, "type": "order.created", "entityId": "<id заказа>",
                "title": "Новый заказ #369494", "body": "Самовывоз · 1 позиция · 340 ₽",
                "createdAt": "2026-11-24T03:29:23.625Z" } ],
  "cursor": 18 }
```
Типы: `order.created` (entityId — id заказа), `certificate.created` (id сертификата).
`title`/`body` обезличенные — их можно показывать в шторке и на экране блокировки.
Приложение сохраняет `cursor` и в следующий раз спрашивает `after=cursor`.
Если вернулось ровно 50 событий — сразу спросить ещё раз.

**Опрос:** раз в 15 минут (минимум для фоновой работы Android, WorkManager) и при открытии приложения.

### `GET /orders?limit=30&before=<ISO-дата>`
Заказы, новые сверху. `before` = `createdAt` последнего заказа в списке — следующая страница.
```json
{ "orders": [ { "id": "…", "shortId": "369494", "status": "new", "statusLabel": "Новый",
                "customerName": "…", "deliveryMethod": "pickup", "totalRub": 340,
                "itemsCount": 1, "createdAt": "…" } ] }
```

### `GET /orders/:id`
Заказ целиком: всё из списка + `customerPhone`, `customerAddress`, `customerComment`,
`items: [{ productName, variant, unit, quantity, priceRub, lineTotalRub }]`.
`quantity`: для `unit = "kg"` — **в граммах**, для `"pcs"` — в штуках. `404` — нет такого заказа.

### `POST /orders/:id/status`
Тело: `{ "status": "picking" }` → `{ "order": { … } }` (заказ целиком после изменения).
Статусы: `new` Новый, `picking` В сборке, `awaiting_payment` Ждёт оплаты, `paid` Оплачен,
`completed` Выполнен, `cancelled` Отменён. Веб-админка предлагает кнопки
«В сборку», «Выполнен», «Отменить» — в приложении те же.

### `GET /certificates/:id`
`{ "certificate": { id, shortNumber, status, statusLabel, amount, senderName, senderContact,
recipientName, recipientContact, message, createdAt } }`.
Статусы: `PENDING` Ожидает оплаты, `PAID` Оплачен, `SENT` Отправлен, `USED` Использован.

## Ошибки
Тело ошибки: `{ "error": "<код>", "message": "<текст для человека>" }`.
`400 bad_request`, `401 unauthorized` / `wrong_password`, `404 not_found`, `429 too_many_attempts`, `500`.

## Где в коде
- маршруты: `app/api/app/**/route.ts`;
- ключи устройств: `lib/app-api/auth.ts`; форматы: `lib/app-api/dto.ts`;
- запись событий: `lib/notify/index.ts` (`recordAppEvent`);
- таблицы: `AppEvent`, `AppDevice` в `prisma/schema.prisma`;
- лимит попыток входа: `lib/rate-limit.ts`.
