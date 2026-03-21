// lib/time.ts

export type StoreStatus = 'open' | 'closing_soon' | 'closed';

export function getStoreStatus(): StoreStatus {
  // Получаем текущее время именно в часовом поясе Томска
  const tzDateString = new Date().toLocaleString('en-US', { timeZone: 'Asia/Tomsk' });
  const tzDate = new Date(tzDateString);

  const day = tzDate.getDay(); // 0 - ВС, 1 - ПН, 2 - ВТ, 3 - СР, 4 - ЧТ, 5 - ПТ, 6 - СБ
  const hours = tzDate.getHours();

  // 1. Воскресенье (0) и Понедельник (1) — полностью выходные дни
  if (day === 0 || day === 1) {
    return 'closed';
  }

  // 2. Задаем часы работы по умолчанию (для ВТ - ПТ)
  let openHour = 10; // с 10:00
  let closeHour = 21; // до 21:00

  // 3. Корректируем часы работы, если сегодня Суббота (6)
  if (day === 6) {
    openHour = 12; // с 12:00
    closeHour = 20; // до 20:00
  }

  // 4. Проверяем, закрыта ли сыроварня прямо сейчас
  if (hours < openHour || hours >= closeHour) {
    return 'closed';
  }

  // 5. Проверяем "последний час" перед закрытием (например, с 20:00 до 20:59 в будни)
  const closingSoonHour = closeHour - 1;
  if (hours >= closingSoonHour && hours < closeHour) {
    return 'closing_soon';
  }

  // В остальное время — открыто!
  return 'open';
}