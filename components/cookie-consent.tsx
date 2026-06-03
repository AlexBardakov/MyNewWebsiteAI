"use client";

/**
 * Cookie-баннер.
 *
 * Уведомляет посетителя об использовании технически необходимых cookies,
 * как того требует Роскомнадзор (информирование, не получение согласия —
 * в РФ нет GDPR-блокирующей модели).
 *
 * Логика:
 *   - При первом монтировании читает localStorage[KEY];
 *   - Если флаг не выставлен — показывает плашку внизу экрана;
 *   - После клика «Понятно» выставляет флаг и плашка исчезает.
 *
 * Плашка не блокирует UI: посетитель может пользоваться сайтом, не нажимая
 * кнопку. Это сознательное решение — мы информируем, а не запрашиваем
 * разрешение на технически необходимые cookies (их использование подразумевается
 * фактом работы сайта).
 *
 * См. также: app/privacy/page.tsx, раздел 11.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

const STORAGE_KEY = "fk-cookie-consent-v1";

export function CookieConsent() {
  // null = ещё не определились (SSR/первый рендер), false = показывать, true = скрыть
  const [acknowledged, setAcknowledged] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const value = window.localStorage.getItem(STORAGE_KEY);
      setAcknowledged(value === "1");
    } catch {
      // localStorage может быть недоступен (приватный режим, ошибки квоты) —
      // в таком случае показываем баннер каждый раз, ничего страшного.
      setAcknowledged(false);
    }
  }, []);

  function dismiss() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Игнорируем — баннер закроется хотя бы на сессию.
    }
    setAcknowledged(true);
  }

  // Не рендерим до того, как определились — иначе будет мерцание.
  if (acknowledged === null || acknowledged === true) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="Уведомление об использовании cookies"
      className="fixed inset-x-0 bottom-0 z-50 px-3 pb-3 sm:px-4 sm:pb-4 pointer-events-none"
    >
      <div className="mx-auto max-w-3xl pointer-events-auto rounded-2xl border border-border bg-card/95 backdrop-blur shadow-lg p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
        <p className="text-sm text-foreground/80 leading-relaxed flex-1">
          Сайт использует только технически необходимые cookies (для работы
          корзины и защищённой части сайта). Подробнее — в{" "}
          <Link href="/privacy" className="font-medium text-primary hover:underline">
            Политике&nbsp;конфиденциальности
          </Link>
          .
        </p>
        <div className="flex items-center gap-2 sm:flex-shrink-0">
          <button
            type="button"
            onClick={dismiss}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors w-full sm:w-auto"
          >
            Понятно
          </button>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Закрыть уведомление"
            className="hidden sm:inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
