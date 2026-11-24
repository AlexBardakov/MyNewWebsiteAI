"use client";

import { RefObject, useEffect, useState } from "react";

/**
 * Возвращает true, как только элемент впервые оказывается рядом с видимой
 * областью экрана (с запасом rootMargin), и дальше остаётся true.
 *
 * Зачем: Яндекс.Карты — это ~700 КБ скриптов и тайлов и заметная нагрузка на
 * процессор телефона. Карты на /about и /delivery стоят внизу страницы, и раньше
 * грузились сразу при открытии, даже если посетитель до них не долистал.
 * Теперь компонент карты ждёт этого сигнала и только потом вызывает loadYandexMaps().
 *
 * rootMargin "400px" — начинаем загрузку чуть заранее, чтобы к моменту, когда
 * карта доедет до экрана, она уже успела отрисоваться.
 */
export function useInViewOnce(
  ref: RefObject<Element | null>,
  rootMargin: string = "400px",
): boolean {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (inView) return;
    const el = ref.current;
    if (!el) return;

    // Очень старые браузеры без IntersectionObserver — грузим сразу, как раньше.
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, rootMargin, inView]);

  return inView;
}
