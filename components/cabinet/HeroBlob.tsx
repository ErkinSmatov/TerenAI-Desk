// Декоративные размытые пятна. Цвета скопированы из lib/ui/palettes.ts приложения CalYo (светлая тема):
// primary #C9F14C, primaryLight #E4F8A5, sky #0EA5E9, violet #8B5CF6. Новые цвета не вводятся.
// Пятна не несут смысла статуса, статичны (без анимаций) и скрыты от вспомогательных технологий.
export function HeroBlob() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-16 -left-10 size-64 rounded-full bg-[#C9F14C] opacity-70 blur-3xl" />
      <div className="absolute -right-12 -bottom-20 size-72 rounded-full bg-[#E4F8A5] opacity-80 blur-3xl" />
      <div className="absolute top-8 right-1/4 size-40 rounded-full bg-[#0EA5E9] opacity-20 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 size-40 rounded-full bg-[#8B5CF6] opacity-15 blur-3xl" />
    </div>
  );
}
