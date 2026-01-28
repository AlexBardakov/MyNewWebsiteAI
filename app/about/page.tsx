import { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import YandexConstructorMap from "@/components/YandexConstructorMap";

export const metadata: Metadata = {
  title: "О магазине и контакты | Four Kings",
  description: "Контакты, адреса и график работы производственной точки Four Kings.",
};

export default function AboutPage() {
  const orgLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Four Kings',
    url: 'https://fourkings.ru',
    contactPoint: [
      { '@type': 'ContactPoint', telephone: '+7-960-970-70-18', contactType: 'production', areaServed: 'RU', availableLanguage: ['ru'] },
    ],
    address: [
      { '@type': 'PostalAddress', addressCountry: 'RU', addressLocality: 'Томск', streetAddress: 'ул. Мокрушина, 9с15' },
    ],
  };

  return (
    <div className="container mx-auto px-4 py-10 space-y-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }}
      />

      <div className="space-y-4 text-center max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-primary">О магазине и контакты</h1>
        <div className="h-1.5 w-24 bg-primary rounded-full mx-auto" />
        <p className="text-lg text-muted-foreground">
          Мы производим сыры с 2015 года — от мягких до выдержанных — и счастливы дарить вам настоящий вкус сыра.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Контакты */}
        <div className="rounded-3xl border border-secondary bg-card p-8 shadow-sm space-y-6">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            Контакты
          </h2>
          <ul className="space-y-4 text-lg">
            <li className="flex flex-col">
              <span className="text-muted-foreground text-sm">Производство (Мокрушина 9с15)</span>
              <a className="hover:text-primary transition-colors font-medium" href="tel:+79609707018">+7 960 970-70-18</a>
            </li>
            <li className="flex flex-col">
              <span className="text-muted-foreground text-sm">Дополнительный номер для связи:</span>
              <a className="hover:text-primary transition-colors font-medium" href="tel:+79962055051">+7 996 205-50-51</a>
            </li>
            <li className="flex flex-col">
              <span className="text-muted-foreground text-sm">Email</span>
              <a className="hover:text-primary transition-colors font-medium" href="mailto:tehnologia07@mail.ru">tehnologia07@mail.ru</a>
            </li>
          </ul>

            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Вопрос по заказу? Скорее свяжитесь с нами!
              </p>
            </div>
        </div>

        {/* График работы */}
        <div className="rounded-3xl border border-secondary bg-card p-8 shadow-sm space-y-6">
          <h2 className="text-2xl font-semibold">График работы</h2>
          <div className="space-y-6">

            <div>
              <div className="font-medium text-lg mb-1">Производство (ул. Мокрушина 9с15).<br/>
               Ориентир - бизнес-центр "Вертикаль"</div>
              <div className="space-y-1 text-muted-foreground">
                <p>Вт–Пт: <span className="text-foreground font-medium">10:00 – 21:00</span></p>
                <p>Сб: <span className="text-foreground font-medium">12:00 – 20:00</span></p>
                <p>Вс–Пн: <Badge variant="secondary">Выходной</Badge></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Карта */}
      <section className="rounded-3xl border border-secondary bg-card p-4 overflow-hidden shadow-sm">
        <h2 className="text-2xl font-semibold mb-6 px-4">Мы на карте</h2>
        <div className="h-[400px] w-full rounded-2xl overflow-hidden relative bg-secondary/10">
          <YandexConstructorMap height={400} />
        </div>
      </section>
    </div>
  );
}