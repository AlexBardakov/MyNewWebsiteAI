/**
 * Простой ограничитель попыток в памяти процесса (одна копия сайта под pm2 — этого достаточно).
 * Используется для входа по паролю: не больше `max` НЕудачных попыток за окно `windowMs`
 * с одного адреса. После перезапуска сайта счётчики обнуляются — это нормально.
 */
type Bucket = { fails: number; resetAt: number };
// Храним в globalThis: Next.js собирает server actions и API-маршруты в разные модули,
// и обычная переменная была бы своя в каждом — счётчик входа в админку и в приложение
// не складывался бы. globalThis один на весь процесс.
const g = globalThis as typeof globalThis & { __fkLoginBuckets?: Map<string, Bucket> };
const buckets: Map<string, Bucket> = (g.__fkLoginBuckets ??= new Map<string, Bucket>());

export interface Limit {
  max: number;
  windowMs: number;
}

/** Сколько секунд ждать, если лимит исчерпан; 0 — можно пробовать. */
export function retryAfterSeconds(key: string, limit: Limit): number {
  const b = buckets.get(key);
  if (!b || b.resetAt <= Date.now()) return 0;
  return b.fails >= limit.max ? Math.ceil((b.resetAt - Date.now()) / 1000) : 0;
}

export function registerFailure(key: string, limit: Limit): void {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) buckets.set(key, { fails: 1, resetAt: now + limit.windowMs });
  else b.fails++;
  // Чистим протухшие записи, чтобы карта не росла бесконечно.
  if (buckets.size > 5000) for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
}

export function resetFailures(key: string): void {
  buckets.delete(key);
}

/** IP клиента за nginx (X-Forwarded-For / X-Real-IP); без них — общий ключ. */
export function clientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return headers.get("x-real-ip") || "unknown";
}
