"use client";

import React from "react";

interface Props {
  height?: number | string;
  width?: number | string;
  mapId?: string;
}

export default function YandexConstructorMap({ height = 400, width = "100%", mapId }: Props) {
  // Получаем ID из пропсов или из ENV
  const id = mapId || process.env.NEXT_PUBLIC_YANDEX_MAP_ID;

  if (!id) {
    return (
      <div
        className="flex items-center justify-center bg-secondary/20 text-muted-foreground rounded-xl"
        style={{ height, width }}
      >
        <p className="p-4 text-center text-sm">
          Карта не найдена. Проверьте ID в .env
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl bg-secondary/10" style={{ height, width }}>
      <iframe
        src={`https://yandex.ru/map-widget/v1/?um=constructor%3A${id}&source=constructor`}
        width="100%"
        height="100%"
        style={{ border: 0, width: "100%", height: "100%", display: "block" }}
        allowFullScreen={true}
        title="Yandex Map"
      />
    </div>
  );
}