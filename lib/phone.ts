// lib/phone.ts
export type PhoneInfo = { e164: string | null; valid: boolean; pretty: string; reason?: string };

export function normalizePhone(raw: string): PhoneInfo {
  const input = String(raw || '').trim();
  const only = input.replace(/[^\d+]/g, '');

  const digits = only.replace(/\D/g, '');
  const pretty = (e: string) => e;

  // E.164 уже с плюсом
  if (only.startsWith('+')) {
    if (digits.length < 10 || digits.length > 15) {
      return { e164: null, valid: false, pretty: input, reason: 'bad_length' };
    }
    return { e164: `+${digits}`, valid: true, pretty: `+${digits}` };
  }

  // RU нормализация: 8XXXXXXXXXX / 7XXXXXXXXXX / XXXXXXXXXX -> +7XXXXXXXXXX
  if (digits.length === 11 && (digits[0] === '7' || digits[0] === '8')) {
    const e = `+7${digits.slice(1)}`;
    return { e164: e, valid: true, pretty: e };
  }
  if (digits.length === 10) {
    const e = `+7${digits}`;
    return { e164: e, valid: true, pretty: e };
  }

  // универсальная попытка (10–15 цифр) как E.164
  if (digits.length >= 10 && digits.length <= 15) {
    return { e164: `+${digits}`, valid: true, pretty: `+${digits}` };
  }

  return { e164: null, valid: false, pretty: input, reason: 'invalid_format' };
}
