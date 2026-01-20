// lib/csv.ts
export function toCSV(rows: Array<Record<string, any>>): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const esc = (v: any) => {
    const s = v === null || v === undefined ? '' : String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push(headers.map(h => esc(r[h])).join(','));
  }
  return lines.join('\n');
}
