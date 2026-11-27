import { describe, expect, it } from "vitest";
import type { GlucosePoint, MealDay } from "./convexApi";
import { barPercent, caloriesSummary, glucoseExtremes, scaleIndex, sugarByHour } from "./patientSummaryView";

function pt(t: number, mmol: number): GlucosePoint {
  return { t, mmol, mgdl: mmol * 18, minMmol: null, maxMmol: null, status: "ok" };
}

const NOW = Date.UTC(2026, 10, 28, 12, 0, 0);
const ZONE = { min: 3.9, max: 7.8 };

describe("sugarByHour", () => {
  it("24 корзины, зоны и пустые часы", () => {
    const bars = sugarByHour(
      [pt(NOW - 3_600_000, 5), pt(NOW - 2 * 3_600_000, 9), pt(NOW - 3 * 3_600_000, 3), pt(NOW - 25 * 3_600_000, 5)],
      NOW,
      0,
      ZONE,
    );
    expect(bars).toHaveLength(24);
    expect(bars[11]).toMatchObject({ zone: "target", mmol: 5 });
    expect(bars[10].zone).toBe("high");
    expect(bars[9].zone).toBe("low");
    expect(bars[0].zone).toBe("none");
  });
  it("учитывает смещение часового пояса", () => {
    const bars = sugarByHour([pt(NOW - 3_600_000, 5)], NOW, 300, ZONE);
    expect(bars[16].zone).toBe("target");
  });
  it("усредняет значения в одном часу", () => {
    const bars = sugarByHour([pt(NOW - 3_600_000, 4), pt(NOW - 3_500_000, 6)], NOW, 0, ZONE);
    expect(bars[11].mmol).toBe(5);
  });
});

describe("glucoseExtremes", () => {
  it("min и max, пусто = null", () => {
    expect(glucoseExtremes([pt(1, 5), pt(2, 8), pt(3, 4)])).toEqual({ min: 4, max: 8 });
    expect(glucoseExtremes([])).toEqual({ min: null, max: null });
  });
});

describe("caloriesSummary", () => {
  const day: MealDay = { date: "2026-11-28", totals: { calories: 800, protein: 1, fat: 1, carbs: 1 }, meals: [] };
  const targets = { calories: 2000, protein: 100, fat: 70, carbs: 250 };
  it("остаток = цель - съедено", () => {
    expect(caloriesSummary(day, targets)).toEqual({ eaten: 800, target: 2000, remaining: 1200, percent: 40 });
  });
  it("без цели остаток null", () => {
    expect(caloriesSummary(day, null)).toMatchObject({ eaten: 800, target: null, remaining: null });
  });
  it("без записей за день съедено 0", () => {
    expect(caloriesSummary(undefined, targets).eaten).toBe(0);
  });
  it("перебор не уходит за 100%, остаток отрицательный", () => {
    const over = { ...day, totals: { ...day.totals, calories: 2500 } };
    expect(caloriesSummary(over, targets)).toMatchObject({ remaining: -500, percent: 100 });
  });
});

describe("barPercent / scaleIndex", () => {
  it("ограничивает 0..100", () => {
    expect(barPercent(50, 100)).toBe(50);
    expect(barPercent(500, 100)).toBe(100);
    expect(barPercent(5, null)).toBe(0);
  });
  it("индекс на шкале в границах", () => {
    expect(scaleIndex(1, 24)).toBe(0);
    expect(scaleIndex(20, 24)).toBe(23);
    expect(scaleIndex(8, 25)).toBe(12);
  });
});
