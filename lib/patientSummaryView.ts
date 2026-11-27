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
