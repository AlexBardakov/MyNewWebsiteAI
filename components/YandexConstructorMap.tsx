"use client";

/**
 * Карта зон доставки для статичных страниц (/about, /delivery).
 *
 * Только отображение: пользователь видит зоны, при клике/наведении —
 * описание (стоимость доставки или адрес производства).
 *
 * Данные грузятся из /zones.geojson — статический файл в /public, который
 * заказчик обновляет вручную после правок карты в Конструкторе Яндекса.
 * Подробности см. lib/yandex-map.ts.
 *
 * Имя файла (`YandexConstructorMap`) — историческое; сам Конструктор
 * Яндекса больше не вызывается, но переименование сломает импорты
 * без какой-либо пользы. Оставлено как есть.
 */

import React, { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { loadYandexMaps, loadDeliveryZones } from "@/lib/yandex-map";

interface Props {
  height?: number | string;
  width?: number | string;
}

export default function YandexConstructorMap({
  height = 400,
  width = "100%",
}: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const ymaps = await loadYandexMaps();
        if (!active || !mapRef.current) return;

        // Дефолтный центр — Томск; ниже setBounds подгонит под содержимое.
        // Координаты в формате [longitude, latitude] — мы загрузили API с coordorder=longlat.
        const map = new ymaps.Map(mapRef.current, {
          center: [84.947649, 56.484640],
          zoom: 11,
          controls: ["zoomControl", "fullscreenControl"],
        });
        mapInstance.current = map;

        const zones = await loadDeliveryZones();
        if (!active) return;

        const objectManager = new ymaps.ObjectManager({
          clusterize: false,
          // ObjectManager по умолчанию показывает балун при клике и хинт при hover.
          // hintContent и balloonContent мы проставили в lib/yandex-map.ts.
        });
        objectManager.add(zones);
        map.geoObjects.add(objectManager);

        try {
          const bounds = objectManager.getBounds();
          if (bounds) {
            map.setBounds(bounds, { checkZoomRange: true, zoomMargin: 20 });
          }
        } catch {
          // На пустой карте getBounds может бросить — оставляем дефолтный центр.
        }

        setLoading(false);
      } catch (err) {
        console.error("Yandex map: ошибка инициализации", err);
        if (active) {
          setError("Не удалось загрузить карту");
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
      if (mapInstance.current) {
        mapInstance.current.destroy();
        mapInstance.current = null;
      }
    };
  }, []);

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-border bg-secondary/10"
      style={{ height, width }}
    >
      <div ref={mapRef} className="w-full h-full absolute inset-0" />
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-card/80 z-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-card z-10 p-4 text-center">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
