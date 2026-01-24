"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from "lucide-react";

declare global {
  interface Window { ymaps: any }
}

interface DeliveryMapProps {
  address?: string;
  onAddressSelect?: (address: string) => void;
  className?: string;
}

export function DeliveryMap({ address, onAddressSelect, className }: DeliveryMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapInstance = useRef<any>(null);
  const placemarkRef = useRef<any>(null);
  const scriptId = 'yandex-maps-script';

  useEffect(() => {
    let active = true;

    const initMap = () => {
        if (!active || !mapRef.current || !window.ymaps) return;

        if (mapInstance.current) {
            setLoading(false);
            return;
        }

        try {
            mapRef.current.innerHTML = '';
            const ym = window.ymaps;

            const map = new ym.Map(mapRef.current, {
                center: [56.484640, 84.947649], // Томск
                zoom: 11,
                controls: ['zoomControl', 'geolocationControl']
            });

            mapInstance.current = map;
            setLoading(false);

            const objectManager = new ym.ObjectManager({
                clusterize: false,
                geoObjectOpenBalloonOnClick: true // Балун с ценой остается!
            });

            map.geoObjects.add(objectManager);

            // Загрузка зон
            fetch('/zones.geojson')
                .then(r => r.json())
                .then(geoJson => {
                    if (geoJson.features) {
                        geoJson.features.forEach((feature: any) => {
                            feature.options = feature.options || {};
                            // Цвета
                            if (feature.properties.fill) feature.options.fillColor = feature.properties.fill;
                            if (feature.properties['fill-opacity']) feature.options.fillOpacity = feature.properties['fill-opacity'];
                            if (feature.properties.stroke) feature.options.strokeColor = feature.properties.stroke;

                            // Описание
                            if (feature.properties.description) feature.properties.balloonContent = feature.properties.description;

                            // Координаты [Long, Lat] -> [Lat, Long]
                            if (feature.geometry?.type === 'Polygon') {
                                feature.geometry.coordinates = feature.geometry.coordinates.map((ring: any[]) => {
                                    return ring.map((coord: number[]) => {
                                        return (coord[0] > coord[1]) ? [coord[1], coord[0]] : coord;
                                    });
                                });
                            }
                        });
                    }
                    objectManager.add(geoJson);
                })
                .catch(console.error);


            // === ГЛАВНОЕ ИСПРАВЛЕНИЕ ===

            // 1. Обработка клика по ПУСТОЙ карте
            map.events.add('click', async (e: any) => {
                const coords = e.get('coords');
                // Закрываем балун зоны, если кликнули в пустоту, чтобы не мешал
                map.balloon.close();
                handleMapClick(coords);
            });

            // 2. Обработка клика по ЗОНЕ (ObjectManager)
            objectManager.events.add('click', (e: any) => {
                // Получаем координаты клика из события
                const coords = e.get('coords');
                // Мы НЕ отменяем открытие балуна (он откроется сам),
                // но дополнительно запускаем выбор адреса
                handleMapClick(coords);
            });

        } catch (err: any) {
            console.error("Ошибка инициализации карты:", err);
            setError("Ошибка загрузки карты");
            setLoading(false);
        }
    };

    // Единая функция обработки клика
    const handleMapClick = (coords: number[]) => {
        updatePlacemark(coords);
        geocodeAndNotify(coords);
    };

    const updatePlacemark = (coords: number[]) => {
        const ym = window.ymaps;
        if (!mapInstance.current) return;

        if (placemarkRef.current) {
            placemarkRef.current.geometry.setCoordinates(coords);
        } else {
            placemarkRef.current = new ym.Placemark(coords, {}, {
                preset: 'islands#redDotIcon',
                draggable: true
            });
            mapInstance.current.geoObjects.add(placemarkRef.current);

            placemarkRef.current.events.add('dragend', () => {
                const newCoords = placemarkRef.current.geometry.getCoordinates();
                geocodeAndNotify(newCoords);
            });
        }
    };

    const geocodeAndNotify = async (coords: number[]) => {
        if (!window.ymaps || !onAddressSelect) return;
        try {
            const res = await window.ymaps.geocode(coords);
            const firstGeoObject = res.geoObjects.get(0);
            if (firstGeoObject) {
                const addressLine = firstGeoObject.getAddressLine();
                const cleanAddress = addressLine.replace(/^Россия,\s*/, '');
                onAddressSelect(cleanAddress);
            }
        } catch (err) {
            console.error("Ошибка геокодинга", err);
        }
    };

    const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY;

    if (window.ymaps) {
        window.ymaps.ready(initMap);
    } else {
        const existingScript = document.getElementById(scriptId);
        if (!existingScript) {
            const script = document.createElement('script');
            script.id = scriptId;
            const keyParam = apiKey ? `&apikey=${apiKey}` : '';
            script.src = `https://api-maps.yandex.ru/2.1/?lang=ru_RU${keyParam}`;
            script.async = true;
            script.onload = () => window.ymaps.ready(initMap);
            document.body.appendChild(script);
        } else {
             const interval = setInterval(() => {
                if (window.ymaps) {
                    clearInterval(interval);
                    window.ymaps.ready(initMap);
                }
            }, 100);
        }
    }

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
        className={`relative overflow-hidden rounded-xl border border-secondary bg-secondary/10 ${className}`}
        style={{ minHeight: '350px', width: '100%' }}
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