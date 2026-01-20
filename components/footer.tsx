export default function Footer() {
  return (
    <footer className="border-t bg-secondary/20 py-8 mt-auto">
      <div className="container flex flex-col items-center justify-between gap-4 md:flex-row text-sm text-muted-foreground">
        <p>© 2026 Сырная Лавка. Все права защищены.</p>
        <div className="flex gap-4">
          <span>Москва, ул. Примерная, 10</span>
          <span>+7 (999) 000-00-00</span>
        </div>
      </div>
    </footer>
  );
}