import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

export default function SuccessPage() {
  return (
    <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center text-center max-w-lg">
      <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-500">
        <CheckCircle2 className="w-12 h-12" />
      </div>

      <h1 className="text-3xl font-bold mb-4">Заказ принят!</h1>
      <p className="text-muted-foreground text-lg mb-8">
        Спасибо за заказ. Мы уже получили его и скоро свяжемся с вами для подтверждения деталей.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link href="/">На главную</Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
          <Link href="/catalog">В каталог</Link>
        </Button>
      </div>
    </div>
  );
}