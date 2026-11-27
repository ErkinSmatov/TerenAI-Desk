// Чистая логика ленты питания (D-05): заголовки дней, прогресс калорий, подписи БЖУ.

const MONTHS_GENITIVE = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];

export function dayHeading(date: string, todayKey: string, yesterdayKey: string): string {
  if (date === todayKey) return "Сегодня";
  if (date === yesterdayKey) return "Вчера";
  const [, month, day] = date.split("-").map(Number);
  return `${day} ${MONTHS_GENITIVE[month - 1]}`;
}

export function formatNumberRu(n: number): string {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(Math.round(n));
}

export function caloriesProgress(
  eaten: number,
  target: number | null,
): { percent: number; overText: string | null } {
  if (target === null || target <= 0) return { percent: 0, overText: null };
  const percent = Math.min(100, Math.max(0, Math.round((eaten / target) * 100)));
  const over = Math.round(eaten - target);
  return { percent, overText: over > 0 ? `+${formatNumberRu(over)} ккал` : null };
}

export function formatMacros(m: { protein: number; fat: number; carbs: number }): string {
  return `Б ${Math.round(m.protein)} · Ж ${Math.round(m.fat)} · У ${Math.round(m.carbs)} г`;
}
