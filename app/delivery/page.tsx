import { Metadata } from "next";
import { Truck, CreditCard } from "lucide-react";
import YandexConstructorMap from "@/components/YandexConstructorMap";

export const metadata: Metadata = {
  title: "Доставка и оплата | Four Kings",
  description: "Условия доставки сыров и способы оплаты в магазине Four Kings.",
};

// Вспомогательный компонент для абзацев с эстетичной меткой
function Paragraph({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4">
      <div className="mt-2 flex-shrink-0">
        {/* Эстетичная метка в виде ромбика цвета primary */}
        <div className="w-2.5 h-2.5 rounded-[2px] bg-primary/80 rotate-45" />
      </div>
      <p className="text-lg text-muted-foreground leading-relaxed">
        {children}
      </p>
    </div>
  );
}

export default function DeliveryPage() {
  return (
    <div className="container mx-auto px-4 py-10 space-y-12">
      {/* Заголовок страницы */}
      <div className="space-y-4 text-center max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-primary">Доставка и оплата</h1>
        <div className="h-1.5 w-24 bg-primary rounded-full mx-auto" />
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Блок Доставка */}
        <div className="rounded-3xl border border-secondary bg-card p-8 shadow-sm space-y-6">
          <h2 className="text-2xl font-semibold flex items-center gap-3">
            <Truck className="w-6 h-6 text-primary" />
            Доставка
          </h2>
          <div className="space-y-5">
            <Paragraph>
              Доставка осуществляется через курьеров Яндекса или Такси Максим, с зонами доставки Вы можете ознакомиться на{" "}
              <a
                href="#map"
                className="text-primary font-medium underline underline-offset-4 hover:text-primary/80 transition-colors"
              >
                карте
              </a>{" "}
              внизу странички. Интерактивные зоны подскажут вам стоимость доставки и минимальную сумму для выбранного района.
            </Paragraph>
            <Paragraph>
              Минимальная сумма заказа для <span className="text-green-600 font-medium">зеленой зоны</span> - 1500 рублей, стоимость доставки 200 рублей, бесплатная доставка для заказов от 3000 рублей.
            </Paragraph>
            <Paragraph>
              Минимальная сумма заказа для <span className="text-amber-500 font-medium">жёлтой зоны</span> - 2000 рублей, стоимость доставки 250 рублей, бесплатная доставка для заказов от 4000 рублей.
            </Paragraph>
            <Paragraph>
              Минимальная сумма заказа для <span className="text-rose-500 font-medium">красной зоны</span> - 2000 рублей, стоимость доставки 300 рублей, бесплатная доставка для заказов от 5000 рублей.
            </Paragraph>
          </div>
        </div>

        {/* Блок Оплата */}
        <div className="rounded-3xl border border-secondary bg-card p-8 shadow-sm space-y-6">
          <h2 className="text-2xl font-semibold flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-primary" />
            Оплата
          </h2>
          <div className="space-y-5">
            <Paragraph>
              После отправки заказа, мы свяжемся с Вами для уточнения и корректировки заказа, а также сообщить реквизиты на оплату. Оплату можно произвести переводом по номеру телефона или через банковскую ссылку банковской картой. Вне зависимости от способа оплаты, к заказу обязательно будет приложен чек покупки с указанием стоимости позиций.
            </Paragraph>
            <Paragraph>
              В отдельных случаях, если все товары из заказа в наличии, а сумма заказа близка к ориентировочной на сайте, мы пришлем Вам ссылку на оплату через банк без предварительного уточнения деталей заказа. В этом случае Вам придет СМС напрямую от нашего банка РСБ. По ссылке из СМС Вы сможете оплатить заказ любой картой, даже кредитной.
            </Paragraph>
            <Paragraph>
              После оплаты заказа, мы сразу начнем поиск курьера или постараемся найти курьера так, чтобы он доставил заказ в удобный для Вас временной диапазон.
            </Paragraph>
          </div>
        </div>
      </div>

      {/* Карта */}
      <section
        id="map"
        className="rounded-3xl border border-secondary bg-card p-4 overflow-hidden shadow-sm scroll-mt-24"
      >
        <h2 className="text-2xl font-semibold mb-6 px-4">Зоны доставки на карте</h2>
        <div className="h-[500px] w-full rounded-2xl overflow-hidden relative bg-secondary/10">
          {/* Используем тот же компонент, что и в about/page.tsx, он сам подтянет ID из .env */}
          <YandexConstructorMap height={500} />
        </div>
      </section>
    </div>
  );
}