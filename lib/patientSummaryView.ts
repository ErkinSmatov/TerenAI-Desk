import type { GlucosePoint, MealDay, Macros } from "./convexApi";

// Чистая логика плиток сводки пациента (макет Figma 1494:5250).

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;

export type SugarZone = "none" | "low" | "target" | "high";
export type SugarBar = { hour: number; mmol: number | null; zone: SugarZone };

// 24 столбика: средняя глюкоза по часам суток (локальный час, offsetMinutes от UTC) за последние 24 ч.
// Зона: ниже целевого диапазона / в нём / выше. Пустой час: zone "none".
export function sugarByHour(
  points: GlucosePoint[],
  now: number,
  offsetMinutes: number,
  zone: { min: number; max: number },
): SugarBar[] {
  const sums = new Array<number>(24).fill(0);
  const counts = new Array<number>(24).fill(0);
  for (const p of points) {
    if (p.t > now || p.t < now - DAY_MS) continue;
    const hour = new Date(p.t + offsetMinutes * 60_000).getUTCHours();
    sums[hour] += p.mmol;
    counts[hour] += 1;
  }
  return sums.map((sum, hour) => {
    if (counts[hour] === 0) return { hour, mmol: null, zone: "none" as const };
    const mmol = sum / counts[hour];
    const z: SugarZone = mmol < zone.min ? "low" : mmol > zone.max ? "high" : "target";
    return { hour, mmol, zone: z };
  });
}

export type GlucoseExtremes = { min: number | null; max: number | null };

export function glucoseExtremes(points: GlucosePoint[]): GlucoseExtremes {
  if (points.length === 0) return { min: null, max: null };
  let min = points[0].mmol;
  let max = points[0].mmol;
  for (const p of points) {
    if (p.mmol < min) min = p.mmol;
    if (p.mmol > max) max = p.mmol;
  }
  return { min, max };
}

export type CaloriesSummary = {
  eaten: number;
  target: number | null;
  remaining: number | null;
  percent: number;
};

// Остаток калорий за день: цель минус съедено; без цели остаток не считается (в UI «—»).
export function caloriesSummary(day: MealDay | undefined, targets: Macros | null): CaloriesSummary {
  const eaten = day ? Math.round(day.totals.calories) : 0;
  const target = targets ? Math.round(targets.calories) : null;
  if (target === null || target <= 0) return { eaten, target: null, remaining: null, percent: 0 };
  return {
    eaten,
    target,
    remaining: target - eaten,
    percent: Math.min(100, Math.max(0, Math.round((eaten / target) * 100))),
  };
}

// Доля заполнения полосы 0..100; без цели полоса пустая.
export function barPercent(value: number, target: number | null): number {
  if (target === null || target <= 0) return 0;
  return Math.min(100, Math.max(0, (value / target) * 100));
}

// Позиция текущего значения на шкале глюкозы (индекс штриха из count) для диапазона [lo, hi] ммоль/л.
export function scaleIndex(value: number, count: number, lo = 2, hi = 14): number {
  const ratio = (value - lo) / (hi - lo);
  return Math.min(count - 1, Math.max(0, Math.round(ratio * (count - 1))));
}

const GLUCOSE_NF = new Intl.NumberFormat("ru-RU", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

// Число глюкозы без единицы (единица выводится отдельной подписью): ммоль/л с одним знаком, мг/дл целое.
export function glucoseValueText(mmol: number, unit: "mmol" | "mgdl"): string {
  return unit === "mgdl" ? String(Math.round(mmol * 18)) : GLUCOSE_NF.format(mmol);
}

// ---------- Кольцо калорий (Figma calories-ring.svg, 141x144) ----------

export const RING = { size: 141, cx: 70.5, cy: 70.5, outer: 70.5, thickness: 9, arcR: 66.5 } as const;

export type RingArc = {
  // path дуги; null, если съедено 0 (дуги нет)
  d: string | null;
  // конец дуги, сюда ставится точка r=6; при нуле точка на старте сверху
  end: { x: number; y: number };
  // доля 0..1 (при превышении цели 1)
  fraction: number;
};

const round3 = (n: number) => Math.round(n * 1000) / 1000;

// Дуга стартует сверху (12 часов) и идёт по часовой стрелке. percent 0..100.
export function ringArc(percent: number): RingArc {
  const fraction = Math.min(1, Math.max(0, Number.isFinite(percent) ? percent / 100 : 0));
  const { cx, cy, arcR: r } = RING;
  const top = { x: cx, y: cy - r };
  if (fraction === 0) return { d: null, end: top, fraction };
  if (fraction >= 1) {
    const bottom = { x: cx, y: cy + r };
    return {
      d: `M ${top.x} ${top.y} A ${r} ${r} 0 1 1 ${bottom.x} ${bottom.y} A ${r} ${r} 0 1 1 ${top.x} ${top.y}`,
      end: top,
      fraction,
    };
  }
  const theta = 2 * Math.PI * fraction;
  const end = { x: round3(cx + r * Math.sin(theta)), y: round3(cy - r * Math.cos(theta)) };
  const large = fraction > 0.5 ? 1 : 0;
  return { d: `M ${top.x} ${top.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`, end, fraction };
}

// ---------- Шкала глюкозы (14 штрихов + маркер, Figma 1494:5542) ----------

export const GLUCOSE_TICKS = 14;

// Сколько штрихов стоит слева от маркера (0..14). Без значения маркер в центре.
export function glucoseMarkerSlot(value: number | null, lo = 2, hi = 14): number {
  if (value === null) return GLUCOSE_TICKS / 2;
  return scaleIndex(value, GLUCOSE_TICKS + 1, lo, hi);
}

// ---------- Столбики «Сахар за день» (Figma 1494:5741) ----------

export const SUGAR_BAR_MIN_H = 20;
export const SUGAR_BAR_MAX_H = 40;

export type SugarBarTone = "empty" | "gap" | "target" | "alert";
export type SugarBarView = SugarBar & { height: number; tone: SugarBarTone };

// Высота нормируется по диапазону измеренных значений в 20..40px (при одном значении 30).
// Цвет: нет измерений: empty (полупрозрачный белый, h=20), часы без измерений между первым и
// последним измеренным: gap (белый, h=20), норма: target (лайм), вне нормы (выше и ниже): alert.
export function sugarBarViews(bars: SugarBar[]): SugarBarView[] {
  const measured = bars.filter((b) => b.mmol !== null);
  if (measured.length === 0) {
    return bars.map((b) => ({ ...b, height: SUGAR_BAR_MIN_H, tone: "empty" as const }));
  }
  const values = measured.map((b) => b.mmol as number);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const first = measured[0].hour;
  const last = measured[measured.length - 1].hour;
  return bars.map((b) => {
    if (b.mmol === null) {
      const inside = b.hour > first && b.hour < last;
      return { ...b, height: SUGAR_BAR_MIN_H, tone: inside ? ("gap" as const) : ("empty" as const) };
    }
    const ratio = hi === lo ? 0.5 : (b.mmol - lo) / (hi - lo);
    const height = Math.round((SUGAR_BAR_MIN_H + ratio * (SUGAR_BAR_MAX_H - SUGAR_BAR_MIN_H)) * 100) / 100;
    return { ...b, height, tone: b.zone === "target" ? ("target" as const) : ("alert" as const) };
  });
}
