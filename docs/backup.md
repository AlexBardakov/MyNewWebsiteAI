# Резервные копии

Что ценно: **база** `prisma/dev.db` (текущие заказы, карточки товаров, сертификаты) и
**фото** `public/uploads/` (без них карточки товаров пустые). Код сайта — в git.

## Как устроено
`scripts/backup.sh` раз в сутки:
1. делает целостную копию базы → `/root/backups/db/dev-ГГГГ-ММ-ДД.db` (последние 14 дней;
   копия через SQLite `VACUUM INTO` — безопасно при работающем сайте, `scripts/backup-db.mjs`);
2. докопирует новые фото → `/root/backups/uploads/`.

Места занимает немного: база — сотни КБ на копию, фото — один экземпляр (~150 МБ).

## Включить (один раз, на сервере)
```bash
bash /root/fourkingssite/scripts/backup.sh        # проверка вручную
crontab -e                                         # и добавить строку:
30 4 * * * bash /root/fourkingssite/scripts/backup.sh >> /root/backups/backup.log 2>&1
```
(каждый день в 04:30 по времени сервера). Проверить, что работает: `tail /root/backups/backup.log`.

## Копия вне сервера
Копии на том же сервере спасают от ошибок («случайно удалил товар»), но не от поломки
самого сервера. Раз в неделю-две скачивайте папку `/root/backups` к себе (WinSCP), либо
включите автоматические снимки диска в панели Selectel.

## Восстановление
Базы:
```bash
pm2 stop fourkingssite
cp prisma/dev.db prisma/dev.db.broken            # на всякий случай
cp /root/backups/db/dev-ГГГГ-ММ-ДД.db prisma/dev.db
pm2 start fourkingssite
```
Фото: `rsync -a /root/backups/uploads/ /root/fourkingssite/public/uploads/`
