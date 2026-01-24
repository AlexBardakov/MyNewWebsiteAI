'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/store/cart';
import { placeOrder } from '@/actions/place-order';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { DeliveryMap } from '@/components/delivery-map';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, clearCart } = useCart();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    deliveryType: 'delivery' as 'delivery' | 'pickup',
    address: '',
    comment: ''
  });

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Корзина пуста</h1>
        <Button asChild><Link href="/catalog">В каталог</Link></Button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.deliveryType === 'delivery' && !formData.address) {
        toast.error("Пожалуйста, укажите адрес доставки");
        return;
    }

    setLoading(true);
    try {
      const res = await placeOrder({
        items,
        total,
        customer: formData
      });

      if (res.success) {
        clearCart();
        router.push('/checkout/success');
      } else {
        toast.error(res.error || 'Ошибка при оформлении');
      }
    } catch (error) {
      toast.error('Произошла ошибка. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <Link href="/cart" className="inline-flex items-center text-muted-foreground hover:text-primary mb-6 transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Вернуться в корзину
      </Link>

      <h1 className="text-3xl font-bold mb-8">Оформление заказа</h1>

      <div className="grid md:grid-cols-12 gap-8">
        {/* Левая колонка: Форма */}
        <div className="md:col-span-7 bg-card border border-secondary rounded-3xl p-6 shadow-sm h-fit">
          <form onSubmit={handleSubmit} className="space-y-6">

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Контактные данные</h2>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Ваше имя *</Label>
                  <Input
                    id="name"
                    required
                    placeholder="Иван"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Телефон *</Label>
                  <Input
                    id="phone"
                    required
                    type="tel"
                    placeholder="+7 (999) 000-00-00"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-secondary">
              <h2 className="text-xl font-semibold">Способ получения</h2>
              <RadioGroup
                value={formData.deliveryType}
                onValueChange={(v: 'delivery' | 'pickup') => setFormData({...formData, deliveryType: v})}
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem value="delivery" id="delivery" className="peer sr-only" />
                  <Label
                    htmlFor="delivery"
                    className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer transition-all"
                  >
                    <span className="mb-2 text-xl">🚚</span>
                    Доставка
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="pickup" id="pickup" className="peer sr-only" />
                  <Label
                    htmlFor="pickup"
                    className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer transition-all"
                  >
                    <span className="mb-2 text-xl">🏪</span>
                    Самовывоз
                  </Label>
                </div>
              </RadioGroup>

              {formData.deliveryType === 'delivery' ? (
                 <div className="space-y-4 animate-in fade-in slide-in-from-top-2">

                    <div className="space-y-2">
                        <Label>Укажите адрес на карте или введите вручную</Label>
                        {/* Карта */}
                        <DeliveryMap
                            className="h-[300px] w-full"
                            address={formData.address}
                            onAddressSelect={(addr) => setFormData({...formData, address: addr})}
                            // Сюда в будущем можно передать зоны
                            // zones={[{ polygon: [...], name: 'Зеленая зона' }]}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Адрес доставки *</Label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Textarea
                              id="address"
                              required
                              placeholder="Город, улица, дом, подъезд..."
                              className="min-h-[80px] pl-10 pt-2"
                              value={formData.address}
                              onChange={(e) => setFormData({...formData, address: e.target.value})}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Нажмите на карту, чтобы автоматически определить адрес.
                        </p>
                    </div>
                 </div>
              ) : (
                <div className="p-4 bg-secondary/30 rounded-xl text-sm text-muted-foreground animate-in fade-in slide-in-from-top-2">
                  📍 Забрать заказ можно по адресу: <br/>
                  <span className="font-medium text-foreground">г. Томск, пр. Комсомольский, 48</span><br/>
                  <span className="text-xs">Ежедневно с 10:00 до 20:00</span>
                </div>
              )}
            </div>

            <div className="space-y-4 pt-4 border-t border-secondary">
              <Label htmlFor="comment">Комментарий к заказу</Label>
              <Textarea
                id="comment"
                placeholder="Код домофона, время доставки, пожелания по упаковке..."
                value={formData.comment}
                onChange={(e) => setFormData({...formData, comment: e.target.value})}
              />
            </div>

            <Button type="submit" size="lg" className="w-full font-bold text-lg h-12" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Оформляем...
                </>
              ) : (
                `Подтвердить заказ на ${Math.round(total).toLocaleString('ru-RU')} ₽`
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Нажимая кнопку, вы принимаете <Link href="/oferta" className="underline hover:text-foreground">Оферту</Link> и соглашаетесь на обработку <Link href="/privacy" className="underline hover:text-foreground">персональных данных</Link>.
            </p>
          </form>
        </div>

        {/* Правая колонка: Сводка */}
        <div className="md:col-span-5">
          <div className="bg-secondary/10 rounded-3xl p-6 sticky top-24">
            <h2 className="text-xl font-bold mb-4">Ваш заказ</h2>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm group">
                  <span className="group-hover:text-primary transition-colors">
                    {item.name} <span className="text-muted-foreground">x {item.unit === 'kg' ? item.quantity.toFixed(3) : item.quantity}</span>
                  </span>
                  <span className="font-medium whitespace-nowrap ml-2">
                    {Math.round(item.priceRub * item.quantity).toLocaleString('ru-RU')} ₽
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-dashed border-secondary space-y-2">
              <div className="flex justify-between font-bold text-xl">
                <span>Итого</span>
                <span>{Math.round(total).toLocaleString('ru-RU')} ₽</span>
              </div>
              {formData.deliveryType === 'delivery' && (
                  <p className="text-xs text-muted-foreground text-right">
                      * Стоимость доставки рассчитывается менеджером
                  </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}