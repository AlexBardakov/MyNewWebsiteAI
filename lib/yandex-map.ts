"use client";

/**
 * Общая обвязка для двух карт сайта (страница «Доставка/О нас» и форма чекаута).
 *
 * История: до перехода на статический GeoJSON эти компоненты дублировали ~40 строк
 * boilerplate-кода загрузки скрипта Яндекс.Карт. Кроме того, формат экспорта
 * Конструктора (simplestyle-spec от Mapbox) расходится с форматом опций Яндекса —
 * это требует ручной конверсии при каждой загрузке.
 *
 * Здесь собрано всё общее:
 *   1. loadYandexMaps()     — синглтон-промис, гарантирует один <script>-тег
 *                             и одно ready-событие.
 *   2. loadDeliveryZones()  — fetch + конверсия simplestyle → ymaps-опции.
 *                             Возвращает FeatureCollection, которую ObjectManager
 *                             понимает «как есть».
 *
 * Архитектура карт после рефакторинга:
 *   - Заказчик правит карту в https://yandex.ru/map-constructor/
 *   - Затем экспортирует GeoJSON → кладёт в /public/zones.geojson вручную.
 *   - Сайт грузит файл same-origin'ом, парсит ObjectManager'ом.
 *   - Никаких обращений к deprecated endpoint'ам Конструктора (см. историю:
 *     раньше использовали api-maps.yandex.ru/services/constructor/1.0/xml/?sid=...,
 *     Яндекс выпилил его, выдаёт 404).
 */

declare global {
  interface Window {
    ymaps: any;
  }
}

const SCRIPT_ID = "yandex-maps-script";
const ZONES_URL = "/zones.geojson";

let scriptPromise: Promise<any> | null = null;

/**
 * Грузит скрипт Яндекс.Карт ровно один раз на жизненный цикл страницы.
 * Безопасно вызывать из нескольких компонентов параллельно — все получат
 * один и тот же промис.
 */
export function loadYandexMaps(): Promise<any> {
  if (typeof window === "undefined") {
    // Защита от случайного вызова на сервере (мы клиентский модуль, но мало ли).
    return Promise.reject(new Error("loadYandexMaps вызван вне браузера"));
  }

  // Если ymaps уже на window (например, скрипт пришёл из bf-cache),
  // просто дожидаемся ready и отдаём.
  if (window.ymaps?.ready) {
    return new Promise((resolve) => window.ymaps.ready(() => resolve(window.ymaps)));
  }

  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY;
    const keyParam = apiKey ? `&apikey=${apiKey}` : "";

    // coordorder=longlat — выравнивает порядок координат API под GeoJSON-стандарт
    // (долгота, широта). Без этого параметра ymaps по умолчанию ждёт [lat, lon],
    // и тогда полигоны зон отрисуются «зеркально» (где-то в районе Антарктиды).
    // Параметр глобальный на всю загрузку API и влияет также на input/output
    // методов geocode, setCenter, getCoordinates и т.п. — см. обе карты.
    const src = `https://api-maps.yandex.ru/2.1/?lang=ru_RU&coordorder=longlat${keyParam}`;

    // На случай если скрипт уже добавлен (например, из старого SPA-навигейта),
    // переиспользуем существующий тег.
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    const script = existing ?? document.createElement("script");

    if (!existing) {
      script.id = SCRIPT_ID;
      script.src = src;
      script.async = true;
      document.body.appendChild(script);
    }

    const handleLoad = () => {
      if (!window.ymaps) {
        reject(new Error("Скрипт Яндекс.Карт загружен, но window.ymaps пуст"));
        return;
      }
      window.ymaps.ready(() => resolve(window.ymaps));
    };

    if (window.ymaps) {
      // Скрипт уже отработал ранее (редкий случай: existing-тег + load событие пропустили)
      handleLoad();
    } else {
      script.addEventListener("load", handleLoad, { once: true });
      script.addEventListener(
        "error",
        () => {
          scriptPromise = null; // следующий вызов попробует ещё раз
          reject(new Error("Не удалось загрузить скрипт Яндекс.Карт"));
        },
        { once: true }
      );
    }
  });

  return scriptPromise;
}

interface SimpleStyleFeature {
  type: "Feature";
  id?: number | string;
  geometry: { type: string; coordinates: unknown };
  properties: Record<string, any>;
  options?: Record<string, any>;
}

export interface ZonesCollection {
  type: "FeatureCollection";
  features: SimpleStyleFeature[];
  metadata?: Record<string, any>;
}

/**
 * Грузит /zones.geojson и приводит его к формату, который понимает ObjectManager.
 *
 * Преобразование simplestyle-spec (это то, что отдаёт Конструктор Яндекса) → ymaps:
 *   - полигоны: fill + fill-opacity → fillColor (#RRGGBBAA),
 *     stroke + stroke-opacity → strokeColor, stroke-width → strokeWidth.
 *   - точки: marker-color синий (#1e98ff) — берём встроенный preset Яндекса
 *     `islands#blueDotIconWithCaption`. Если в карте появятся другие цвета
 *     меток — нужно будет добавить маппинг (или загрузить кастомную иконку).
 *
 * description (из Конструктора) идёт в:
 *   - properties.balloonContent — показывается при клике;
 *   - properties.hintContent    — показывается при наведении (десктоп, не touch).
 *
 * Балун открывается ObjectManager'ом автоматически — нам не нужно ловить клик.
 */
export async function loadDeliveryZones(): Promise<ZonesCollection> {
  const res = await fetch(ZONES_URL, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Не удалось загрузить ${ZONES_URL}: HTTP ${res.status}`);
  }
  const data = (await res.json()) as ZonesCollection;

  data.features = data.features.map((feature) => {
    const props = feature.properties || {};
    const description: string | undefined = props.description;

    const geomType = feature.geometry?.type;
    const isPolygon = geomType === "Polygon" || geomType === "MultiPolygon";
    const isPoint = geomType === "Point";

    if (isPolygon) {
      feature.options = {
        fillColor: hexWithAlpha(props.fill ?? "#cccccc", props["fill-opacity"] ?? 0.5),
        strokeColor: hexWithAlpha(props.stroke ?? "#888888", props["stroke-opacity"] ?? 0.9),
        strokeWidth: Number(props["stroke-width"]) || 2,
      };
      feature.properties = {
        ...props,
        balloonContent: description,
        hintContent: description,
      };
    } else if (isPoint) {
      feature.options = {
        preset: "islands#blueDotIconWithCaption",
      };
      feature.properties = {
        ...props,
        balloonContent: description,
        hintContent: props.iconCaption || description,
      };
    }

    return feature;
  });

  return data;
}

/** #RRGGBB + alpha (0..1) → #RRGGBBAA, который ymaps читает нативно. */
function hexWithAlpha(hex: string, alpha: number): string {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex}${a}`;
}
