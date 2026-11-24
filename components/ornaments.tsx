/**
 * Декоративные SVG-орнаменты для Four Kings.
 *
 * После UX-аудита в июне 2026 файл сильно похудел: остался только
 * `DividerOrnament` — горизонтальная линия с тремя ромбами в центре.
 * Это **единственный** общий декор бренда для всех публичных страниц:
 *   - между категориями каталога (ритм);
 *   - под заголовком hero на about / delivery / recipes и т.п. (единый язык);
 *   - можно использовать локально как разделитель внутри секций.
 *
 * Раньше тут жили также: CrownIcon, DividerCrown, FiligreeFlourish,
 * CornerOrnament, FlourishedHeading — все они были визуально слишком
 * вычурными и не сочетались с премиальной чистотой остального дизайна.
 * Заказчик принял решение убрать их полностью.
 *
 * `DividerOrnament` принимает:
 *  - className — кастомные классы Tailwind (цвет через text-primary, ширина через max-w-*);
 *  - SVG/divы используют `currentColor`, цвет управляется через text-* utility.
 *
 * По умолчанию: цвет наследуется (`text-primary/60`), размер — задаётся через классы.
 */

import { cn } from "@/lib/utils";

/**
 * Разделитель с орнаментом (три ромба в центре между двумя полосками).
 * Используется как акцент-разделитель между смысловыми блоками
 * и как декоративный элемент под hero-заголовком.
 *
 * Пример:
 *   <DividerOrnament className="max-w-xs mx-auto" />
 */
export function DividerOrnament({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center w-full gap-5 sm:gap-7 text-primary/60",
        className
      )}
      aria-hidden
    >
      <span className="flex-1 h-0.5 bg-current rounded-full" />
      {/* Тройной ромб с увеличенными отступами для "воздуха" */}
      <span className="flex items-center gap-2.5">
        <span className="h-1.5 w-1.5 rotate-45 bg-current" />
        <span className="h-2.5 w-2.5 rotate-45 bg-current" />
        <span className="h-1.5 w-1.5 rotate-45 bg-current" />
      </span>
      <span className="flex-1 h-0.5 bg-current rounded-full" />
    </div>
  );
}
