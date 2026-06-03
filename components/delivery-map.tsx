"use client";

/**
 * Карта на странице оформления заказа (/checkout).
 *
 * Что показывает: те же зоны и точку производства, что и YandexConstructorMap
 * (общий источник — /zones.geojson, см. lib/yandex-map.ts).
 *
 * Дополнительная логика по сравнению с YandexConstructorMap:
 *   - Клик по любой точке карты ставит/перемещает красную метку выбора адреса.
 *   - Параллельно идёт обратный геокод (координаты → адрес) и адрес уходит
 *     в parent через onAddressSelect — заполняет поле формы.
 *   - Метка draggable, после перетаскивания снова идёт геокод.
 *   - При клике по зоне дополнительно открывается её балун (стоимость доставки)
 *     — пользователь видит цену по выбранному адресу без отдельного действия.
 *   - На десктопе при наведении на зону показывается hint со стоимостью
 *     (на touch-устройствах hover не работает — там остаётся только клик).
 */

import React, { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { loadYandexMaps, loadDeliveryZones } from "@/lib/yandex-map";

interface DeliveryMapProps {
  address?: string;
  onAddressSelect?: (address: string) => void;
  className?: string;
}

export function DeliveryMap({ onAddressSelect, className }: DeliveryMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const placemarkRef = useRef<any>(null);
  // onAddressSelect через ref, чтобы не пересоздавать карту при каждом ре-рендере
  // родителя (родитель обновляет состояние формы → меняется ссылка на функцию).
  const onAddressSelectRef = useRef(onAddressSelect);
  onAddressSelectRef.current = onAddressSelect;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const geocodeAndNotify = async (coords: number[]) => {
      if (!window.ymaps) return;
      try {
        const res = await window.ymaps.geocode(coords);
        const firstGeoObject = res.geoObjects.get(0);
        if (firstGeoObject) {
          const addressLine = firstGeoObject.getAddressLine();
          const cleanAddress = addressLine.replace(/^Россия,\s*/, "");
          onAddressSelectRef.current?.(cleanAddress);
        }
      } catch (err) {
        console.error("Ошибка геокодинга", err);
      }
    };

    const updatePlacemark = (coords: number[]) => {
      if (!window.ymaps || !mapInstance.current) return;

      if (placemarkRef.current) {
        placemarkRef.current.geometry.setCoordinates(coords);
        return;
      }

      placemarkRef.current = new window.ymaps.Placemark(
        coords,
        {},
        { preset: "islands#redDotIcon", draggable: true }
      );
      mapInstance.current.geoObjects.add(placemarkRef.current);

      placemarkRef.current.events.add("dragend", () => {
        const newCoords = placemarkRef.current.geometry.getCoordinates();
        geocodeAndNotify(newCoords);
      });
    };

    const handlePick = (coords: number[]) => {
      updatePlacemark(coords);
      geocodeAndNotify(coords);
    };

    (async () => {
      try {
        const ymaps = await loadYandexMaps();
        if (!active || !mapRef.current) return;

        // Координаты в [lon, lat] — соответствует coordorder=longlat (см. lib/yandex-map.ts).
        const map = new ymaps.Map(mapRef.current, {
          center: [84.947649, 56.484640],
          zoom: 11,
          controls: ["zoomControl", "geolocationControl"],
        });
        mapInstance.current = map;

        const zones = await loadDeliveryZones();
        if (!active) return;

        const objectManager = new ymaps.ObjectManager({ clusterize: false });
        objectManager.add(zones);
        map.geoObjects.add(objectManager);

        // Подгоняем границы под зоны/точку.
        try {
          const bounds = objectManager.getBounds();
          if (bounds) {
            map.setBounds(bounds, { checkZoomRange: true, zoomMargin: 20 });
          }
        } catch {
          // Если bounds не вычислились — оставим дефолтный центр.
        }

        // Клик по объекту (зоне или точке): ObjectManager сам открывает балун с
        // описанием (мы проставили balloonContent в lib/yandex-map.ts), а мы ещё
        // ставим/двигаем метку выбора адреса и геокодим.
        objectManager.objects.events.add("click", (e: any) => {
          const coords = e.get("coords");
          handlePick(coords);
        });

        // Клик по пустой карте (не по объекту): закрываем балун, если он открыт,
        // и ставим/двигаем метку. Проверка target !== map нужна, чтобы не дублировать
        // handlePick для кликов по объектам — те уже обработаны выше.
        map.events.add("click", (e: any) => {
          if (e.get("target") !== map) return;
          map.balloon.close();
          handlePick(e.get("coords"));
        });

        setLoading(false);
      } catch (err) {
        console.error("DeliveryMap: ошибка инициализации", err);
        if (active) {
          setError("Ошибка загрузки карты");
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
      placemarkRef.current = null;
    };
  }, []);

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-secondary bg-secondary/10 ${className}`}
      style={{ minHeight: "350px", width: "100%" }}
    >
      <div ref={mapRef} className="w-full h-full absolute inset-0" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 z-10 p-4 text-center">
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
