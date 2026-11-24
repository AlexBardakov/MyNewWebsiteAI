# Чек-лист деплоя юридического пакета изменений

> Этот файл описывает безопасный порядок переноса изменений из worktree
> `unruffled-saha-a9e334` на прод-сервер (fourkings.ru, landvps.ru).
>
> **Не подавайте уведомление в РКН** до завершения всех пунктов и контрольной
> проверки на проде — Политика должна соответствовать реальному поведению сайта.

## Что вошло в этот пакет изменений

### Авторитетный список (источник — `git status` в worktree)

**12 изменённых файлов кода (M):**
- `actions/certificates.ts` — серверная валидация двух согласий + фиксация `consentAcceptedAt` + обезличенное уведомление в Telegram.
- `actions/create-order.ts` — синхронизирован с новым интерфейсом Telegram (legacy-файл, оставлен для совместимости сборки).
- `actions/place-order.ts` — серверная валидация согласий + фиксация `consentAcceptedAt`.
- `app/admin/orders/[id]/page.tsx` — отображение варианта товара в строке заказа.
- `app/certificates/page.tsx` — 2 чекбокса согласия + клиентская валидация.
- `app/checkout/page.tsx` — 2 чекбокса согласия + клиентская валидация.
- `app/layout.tsx` — расширены метаданные, подключён `<CookieConsent />`.
- `app/privacy/page.tsx` — полностью переписана Политика (152-ФЗ ст. 18.1 ч. 2), дата редакции 26.05.2026.
- `components/footer.tsx` — удалена ссылка на Instagram (Meta, экстремистская в РФ).
- `lib/telegram.ts` — обезличены уведомления; ФИО / телефон / адрес больше не уходят в Telegram.
- `next.config.ts` — `remotePatterns` сужен до собственного домена.
- `prisma/schema.prisma` — добавлены nullable-поля `Order.consentAcceptedAt` и `Certificate.consentAcceptedAt`.

**1 удалённый файл (D):**
- `app/page.tsx` — мёртвый код (был только редирект); при переносе на основной репо явно сделай `git rm app/page.tsx`.

**1 новый файл кода (untracked):**
- `components/cookie-consent.tsx` — новый компонент, информирует о технически необходимых cookies.

**2 новых документа (untracked, переносить опционально):**
- `docs/privacy-draft.md` — рабочий черновик Политики (можно оставить как историческую фиксацию решений на случай вопросов РКН, или удалить).
- `docs/deployment-checklist.md` — этот самый файл; рекомендую сохранить в репозитории как memory для повторного применения процедуры.

**Итого: 14 файлов кода (12 изменённых + 1 удалённый + 1 новый) + 2 документа.**

### Что НЕ переносить
- `.claude/` — служебная папка системы worktrees (метаданные инструмента, не код проекта).

### Изменения схемы БД (важно про SQLite-миграцию)
- В модели `Order` добавлено nullable-поле `consentAcceptedAt DateTime?`.
- В модели `Certificate` добавлено nullable-поле `consentAcceptedAt DateTime?`.
- Существующие записи получают `NULL` — это безопасно, никаких потерь данных нет.
- Команда для применения на проде — в шаге 3 ниже (`prisma db push` или ручной `ALTER TABLE`).

## Порядок применения

### 1. Бэкап БД (ОБЯЗАТЕЛЬНО, прежде чем что-либо делать)

На проде:
```bash
# Найди файл базы — путь указан в DATABASE_URL в .env. Обычно prisma/prod.db или похоже.
cp /path/to/prod.db /path/to/prod.db.backup-2026-05-26
```

Убедись, что бэкап реально создался и не нулевого размера:
```bash
ls -la /path/to/prod.db.backup-2026-05-26
```

### 2. Перенос кода из worktree в основной репозиторий

Из основного репозитория `E:\Cheese-site-rework\my-cheese-shop`:

```bash
# Посмотри какие файлы изменились в worktree
git -C .claude/worktrees/unruffled-saha-a9e334 status
git -C .claude/worktrees/unruffled-saha-a9e334 diff --stat HEAD
```

Если в worktree всё устраивает — можно перенести коммитом в новый бранч:

```bash
# Создать бранч от main для пакета изменений
git checkout -b feat/legal-compliance-pack

# Перенести изменения файлами (есть несколько вариантов — выбери удобный)
# Вариант А: rsync (Windows нужен git-bash или WSL)
rsync -av --exclude '.git' --exclude 'node_modules' --exclude '.next' \
   .claude/worktrees/unruffled-saha-a9e334/ ./

# Вариант Б: ручное копирование изменённых файлов (списком выше)
```

Затем коммит и push:
```bash
git add -A
git status   # проверить что попало
git commit -m "feat: юридический пакет (152-ФЗ): Политика, согласия, обезличенный Telegram, поля consentAcceptedAt"
git push origin feat/legal-compliance-pack
```

### 3. Применить миграцию схемы на проде

После того как новый код выкачан на прод-сервер (через `git pull` или CI):

```bash
# На проде, в директории проекта:

# Прогенерировать Prisma-клиент с новыми типами (никаких изменений в БД)
npx prisma generate

# Применить изменения схемы к БД (добавит nullable-поля)
# В этом проекте используется prisma db push (видимо), потому что в .gitignore
# нет папки prisma/migrations
npx prisma db push
```

Альтернатива (если хочешь руками, без Prisma CLI — для SQLite):
```bash
sqlite3 /path/to/prod.db
> ALTER TABLE "Order" ADD COLUMN "consentAcceptedAt" DATETIME;
> ALTER TABLE "Certificate" ADD COLUMN "consentAcceptedAt" DATETIME;
> .quit
```

Оба варианта добавляют nullable-колонки. Никакие существующие записи не теряются.

### 4. ⚠️ Критическая проверка зависимостей перед билдом

В текущем `package.json` **отсутствуют** пакеты `axios` и `socks-proxy-agent`, хотя они используются в `lib/telegram.ts` и `app/api/telegram/route.ts`. На проде сейчас они стоят по инерции (видимо, были когда-то установлены, потом package.json почистился). Если на проде кто-то когда-то сделает чистый `npm install` — **Telegram отвалится**.

**Перед билдом** проверь:
```bash
ls node_modules/axios 2>/dev/null && echo "axios OK" || echo "axios MISSING"
ls node_modules/socks-proxy-agent 2>/dev/null && echo "socks-proxy-agent OK" || echo "socks-proxy-agent MISSING"
```

Если хотя бы один MISSING — почини сейчас:
```bash
npm install axios socks-proxy-agent --save
git add package.json package-lock.json
git commit -m "fix: явная фиксация зависимостей axios и socks-proxy-agent"
git push
```

(Это надо сделать **до** билда, иначе Telegram-уведомления не будут работать.)

### 5. Билд и деплой

```bash
npm run build
# затем твой обычный способ перезапуска (pm2 restart, systemctl restart, ...)
```

### 6. Smoke-test на проде (ОБЯЗАТЕЛЬНО)

Открой реальный сайт https://fourkings.ru и пройди этот список:

- [ ] Главная (`/`) редиректит на `/catalog`.
- [ ] Внизу появляется cookie-баннер. После клика «Понятно» — больше не появляется при следующем заходе (проверь в другом браузере или в инкогнито).
- [ ] Открой `/privacy` — Политика читается, дата редакции 26 мая 2026 г., нет упоминаний `admin_session` и нет «Администраторы Сайта», нет бухучёта.
- [ ] Открой `/oferta` — оферта на месте.
- [ ] В футере **нет** иконки Instagram, есть только Telegram. ИП-реквизиты на месте.
- [ ] Добавь товар в корзину, перейди к чекауту. Заполни форму. **Без двух галочек кнопка `Подтвердить заказ` неактивна.**
- [ ] Поставь галочки, оформи тестовый заказ.
- [ ] В Telegram пришло уведомление: **БЕЗ имени, БЕЗ телефона, БЕЗ адреса**. Есть состав, сумма, тип получения, ссылка на админку.
- [ ] По ссылке из Telegram открывается админка → страница заказа со всеми ПДн, в том числе **с вариантом товара** (если в заказе был вариант — например «Качокавалло Цитрус (Лимон)»).
- [ ] Открой `/certificates`, заполни форму. **Без двух галочек кнопка `Создать сертификат` неактивна.**
- [ ] В админке поверь, что в Order и Certificate появились ненулевые `consentAcceptedAt` для нового тестового заказа/сертификата. Через SQL:
   ```sql
   SELECT id, customerName, consentAcceptedAt FROM "Order" ORDER BY createdAt DESC LIMIT 5;
   SELECT id, senderName, consentAcceptedAt FROM "Certificate" ORDER BY createdAt DESC LIMIT 5;
   ```

### 7. Подача уведомления в Роскомнадзор

После всех «галочек» выше:

1. https://pd.rkn.gov.ru → «Информационные системы» → «Уведомления операторов».
2. Заполнить уведомление, опираясь на содержание `app/privacy/page.tsx`:
   - оператор: ИП Фокин К. В., ИНН 700300550808;
   - цели обработки: раздел 4 Политики;
   - категории ПДн: раздел 3 Политики;
   - категории субъектов: раздел 2 Политики;
   - меры защиты: раздел 10 Политики;
   - срок хранения: раздел 6.3 Политики;
   - **трансграничная передача: НЕ ОСУЩЕСТВЛЯЕТСЯ** (раздел 7.3);
   - место обработки: РФ, российский хостинг (landvps.ru, раздел 7.2).
3. Подписать ЭП (если есть) или отправить заказным письмом с описью.

## Что НЕ вошло в этот пакет (известные баги — на следующую сессию)

- [ ] `axios` и `socks-proxy-agent` в `package.json` — см. шаг 4 выше; либо чиним прямо при деплое, либо отдельным шагом.
- [ ] `app/cart/page.tsx:13` — импорт `@/components/ui/alert`, которого нет. Корзина из-за этого может не собираться. Надо либо создать компонент Alert (shadcn-стандарт), либо убрать импорт.
- [ ] `app/api/telegram/route.ts:101` — `catch (e)` без типа (implicit any). Не критично, но засоряет логи tsc.
- [ ] Списание остатков товаров при оформлении заказа — критическая логическая дыра, остатки не уменьшаются.
- [ ] `JWT_SECRET` fallback на `"default-secret"` в `lib/auth.ts:5` — переменная должна быть обязательной.
- [ ] Plaintext-сравнение `ADMIN_PASSWORD` в `app/admin/login/actions.ts` — должно быть через bcrypt.
- [ ] `middleware.ts:26-31` — multipart-загрузки обходят JWT-проверку (костыль с комментарием «ФИКС ОШИБКИ 500»).
- [ ] `app/cheese-plate/page.tsx` — проверки `remainder > 0.1` на `Int`-поле.

Эти задачи — на следующую сессию доработки.
