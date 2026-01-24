import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t bg-secondary/20 py-8 mt-auto">
      <div className="container flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-muted-foreground">

        <div className="flex flex-col items-center md:items-start gap-2">
          <p>© 2026 CheeseShop. ИП Фокин К.В.</p>
          <div className="flex gap-4">
            <Link href="/oferta" className="hover:text-primary transition-colors hover:underline">Публичная оферта</Link>
            <Link href="/privacy" className="hover:text-primary transition-colors hover:underline">Политика конфиденциальности</Link>
          </div>
        </div>

        <div className="flex flex-col items-center md:items-end gap-1 text-center md:text-right">
          <p>г. Томск, пр. Комсомольский, 48</p>
          <a href="tel:+79609707018" className="hover:text-foreground transition-colors">+7 (960) 970-70-18</a>
        </div>
      </div>
    </footer>
  );
}