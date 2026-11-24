#!/usr/bin/env bash
# Ежедневная резервная копия сайта Four Kings: база (заказы, товары, сертификаты) и фото.
# Запуск по cron раз в сутки — см. docs/backup.md. Можно запускать и вручную:
#   bash /root/fourkingssite/scripts/backup.sh
#
# Что делает:
#   1) целостная копия базы  → /root/backups/db/dev-ГГГГ-ММ-ДД.db, хранятся последние 14 дней;
#   2) фото товаров/рецептов → /root/backups/uploads/ (зеркало: докопируются только новые файлы).
set -euo pipefail

PROJECT="${PROJECT:-/root/fourkingssite}"
DEST="${DEST:-/root/backups}"
KEEP_DAYS="${KEEP_DAYS:-14}"

cd "$PROJECT"
mkdir -p "$DEST/db" "$DEST/uploads"

echo "=== $(date '+%F %T') резервная копия"
node scripts/backup-db.mjs "$DEST/db/dev-$(date +%F).db"
find "$DEST/db" -name 'dev-*.db' -mtime +"$KEEP_DAYS" -delete

# Фото: копируем только новое/изменённое; удалённые на сайте файлы в копии остаются (на всякий случай).
if command -v rsync >/dev/null 2>&1; then
  rsync -a public/uploads/ "$DEST/uploads/"
else
  cp -ru public/uploads/. "$DEST/uploads/"
fi
echo "✓ фото: $(find "$DEST/uploads" -type f | wc -l) файлов, $(du -sh "$DEST/uploads" | cut -f1)"
