import Link from "next/link";
import { Phone, MapPin, Clock } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t bg-white border-gray-100 py-12 mt-auto">
      <div className="container mx-auto px-4 md:px-8">

        {/* Сетка из 3 колонок */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">

          {/* 1. ЛЕВАЯ КОЛОНКА: Организация */}
          <div className="flex flex-col gap-4">
            <div>
               <h3 className="font-bold text-xl text-gray-900 mb-2">Сыроварня Four Kings</h3>
               <p className="text-sm text-muted-foreground leading-relaxed">
                 Производство крафтовых сыров со знаком качества.<br/><br/>
                 ИП Фокин Константин Васильевич<br/>
                 ИНН 700300550808<br/>
                 ОГРНИП 318703100093366
               </p>
            </div>
            <div className="mt-auto">
               <p className="text-xs text-muted-foreground">
                 © 2026 Все права защищены.
               </p>
            </div>
          </div>

          {/* 2. СРЕДНЯЯ КОЛОНКА: Навигация (Карта сайта) */}
          <div className="flex flex-col gap-4">
            <h3 className="font-semibold text-gray-900">Навигация</h3>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/catalog" className="hover:text-primary transition-colors w-fit">Каталог товаров</Link>
              <Link href="/cheese-plate" className="hover:text-primary transition-colors w-fit">Сырная тарелка</Link>
              <Link href="/recipes" className="hover:text-primary transition-colors w-fit">Книга рецептов</Link>
              <Link href="/about" className="hover:text-primary transition-colors w-fit">О нас</Link>

              <div className="h-px bg-gray-100 w-full my-2 max-w-[150px]" />

              <Link href="/oferta" className="hover:text-primary transition-colors w-fit">Публичная оферта</Link>
              <Link href="/privacy" className="hover:text-primary transition-colors w-fit">Политика конфиденциальности</Link>
            </nav>
          </div>

          {/* 3. ПРАВАЯ КОЛОНКА: Контакты */}
          <div className="flex flex-col gap-4">
            <h3 className="font-semibold text-gray-900">Контакты</h3>
            <div className="flex flex-col gap-4 text-sm text-muted-foreground">

              <a href="tel:+79609707018" className="flex items-center gap-3 hover:text-primary transition-colors group">
                <div className="p-2 bg-secondary/30 rounded-full group-hover:bg-primary/10 transition-colors">
                    <Phone className="w-4 h-4 text-gray-900 group-hover:text-primary" />
                </div>
                <span className="font-bold text-lg text-gray-900 group-hover:text-primary transition-colors">
                    +7 (960) 970-70-18
                </span>
              </a>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-secondary/30 rounded-full mt-[-2px]">
                    <MapPin className="w-4 h-4 text-gray-900" />
                </div>
                <span className="leading-relaxed">
                    г. Томск, ул. Мокрушина 9с15
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary/30 rounded-full">
                    <Clock className="w-4 h-4 text-gray-900" />
                </div>
                <span>Вт-Пт с 10:00 до 21:00<br/>Сб с 12:00 до 20:00<br/>Вс-Пн - выходной</span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}