// lib/pagination.ts
export type Cursor = { createdAt: string; id: string }; // ISO + id

export function encodeCursor(c: Cursor): string {
  return Buffer.from(JSON.stringify(c), 'utf8').toString('base64url');
}

export function decodeCursor(s?: string | null): Cursor | null {
  if (!s) return null;
  try {
    const obj = JSON.parse(Buffer.from(String(s), 'base64url').toString('utf8'));
    if (obj && typeof obj.createdAt === 'string' && typeof obj.id === 'string') return obj;
  } catch {}
  return null;
}

/**
 * Построить where для keyset-пагинации по (createdAt desc, id desc)
 */
export function buildKeysetWhere(c: Cursor | null) {
  if (!c) return {};
  const t = new Date(c.createdAt);
  if (isNaN(t.getTime())) return {};
  return {
    OR: [
      { createdAt: { lt: t } },
      { AND: [{ createdAt: t }, { id: { lt: c.id } }] },
    ],
  };
}

export function makeNextCursor<T extends { createdAt: Date; id: string }>(items: T[] | null | undefined) {
  if (!items || items.length === 0) return null;
  const last = items[items.length - 1];
  return encodeCursor({ createdAt: last.createdAt.toISOString(), id: last.id });
}
