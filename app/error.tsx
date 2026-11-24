"use client";

/**
 * Глобальный error boundary Next.js. Срабатывает на любую невосстановимую
 * клиентскую ошибку при рендере под `app/` (но НЕ в самом `app/layout.tsx`
 * — там нужен отдельный `app/global-error.tsx`, если когда-нибудь понадобится).
 *
 * Главный кейс, ради которого это писалось: после деплоя у пользователя в
 * старой вкладке грузится свежий бандл, который пытается дёрнуть server action
 * со старым ID. Сервер не находит, бросает «Failed to find Server Action 'x'»,
 * страница ломается. Лечится HARD reload'ом — нужен новый JS-бандл с актуальными
 * action ID. SPA-перерендер через reset() здесь НЕ помогает.
 *
 * Поэтому главная кнопка — `window.location.reload()`, а не reset().
 *
 * Долгосрочно проблему «Server Action ID меняется при каждом билде» можно
 * решить, зафиксировав NEXT_DEPLOYMENT_ID в env при билде (стабильные ID
 * между билдами). Это отдельный шаг, не блокирует ничего, ставим на потом.
 *
 * Что точно НЕ делаем здесь:
 *   - Не показываем пользователю текст error.message — там может быть
 *     внутренняя информация о путях, стек и т.п. Только дружелюбное
 *     «что-то пошло не так».
 *   - error.digest пишется Next.js'ом на сервере и попадает в pm2-логи —
 *     по нему уже можно найти полный стек, не показывая его клиенту.
 */

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RotateCcw, Home } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  /**
   * Next.js предоставляет reset() для попытки повторного рендера сегмента.
   * В нашем основном кейсе он не помогает (см. комментарий в начале файла),
   * поэтому реально не вызываем. Оставлен в сигнатуре для совместимости с
   * Next.js-конвенцией и на случай будущих сценариев, где он пригодится.
   */
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  void reset; // сознательно не используем; см. комментарий в начале файла

  useEffect(() => {
    // В прод-логах pm2 это позволит связать жалобу пользователя
    // («у меня была ошибка минут пять назад») с конкретным digest'ом.
    console.error("[GlobalError]", error.message, error.digest);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-16 sm:py-20 flex flex-col items-center justify-center text-center min-h-[60vh]">
      <div className="w-24 h-24 bg-secondary/30 rounded-full flex items-center justify-center mb-6">
        <span className="text-4xl" aria-hidden>🧀</span>
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold mb-3">Что-то пошло не так</h1>

      <p className="text-muted-foreground mb-2 max-w-md leading-relaxed">
        Произошла техническая ошибка при загрузке этой страницы. Обычно это
        лечится перезагрузкой — мы недавно обновлялись, и старая вкладка могла
        не успеть подтянуть свежие данные.
      </p>

      <p className="text-muted-foreground text-sm mb-8 max-w-md leading-relaxed">
        Если перезагрузка не помогла — позвоните нам, оформим заказ по телефону:{" "}
        <a
          className="font-medium text-primary hover:underline whitespace-nowrap"
          href="tel:+79609707018"
        >
          +7&nbsp;(960)&nbsp;970-70-18
        </a>
        .
      </p>

      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        <Button
          size="lg"
          onClick={() => {
            // Hard reload — поднимает свежий JS-бандл. Именно это нужно для
            // «Failed to find Server Action», самой частой причины срабатывания.
            window.location.reload();
          }}
          className="gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Перезагрузить страницу
        </Button>
        <Button asChild variant="outline" size="lg" className="gap-2">
          <Link href="/">
            <Home className="h-4 w-4" />
            На главную
          </Link>
        </Button>
      </div>

      {/* Технический ID ошибки — мелким серым, без расшифровки. Если клиент
          обращается по телефону с проблемой, оператор может попросить «зачитать
          код в самом низу страницы» и потом найти этот digest в pm2-логах. */}
      {error.digest && (
        <p className="mt-10 text-xs text-muted-foreground/70 font-mono select-all">
          ID: {error.digest}
        </p>
      )}
    </div>
  );
}
