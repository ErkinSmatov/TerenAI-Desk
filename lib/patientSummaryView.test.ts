import { describe, expect, it } from "vitest";
import type { GlucosePoint, MealDay } from "./convexApi";
import {
  barPercent,
  caloriesSummary,
  glucoseExtremes,
  glucoseMarkerSlot,
  glucoseValueText,
  ringArc,
  scaleIndex,
  sugarBarViews,
  sugarByHour,
} from "./patientSummaryView";

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

describe("glucoseValueText", () => {
  it("ммоль/л с запятой и одним знаком, мг/дл целое", () => {
    expect(glucoseValueText(5.55, "mmol")).toBe("5,6");
    expect(glucoseValueText(5, "mmol")).toBe("5,0");
    expect(glucoseValueText(5.5, "mgdl")).toBe("99");
  });
});

describe("ringArc", () => {
  it("0%: дуги нет, точка на старте сверху", () => {
    expect(ringArc(0)).toMatchObject({ d: null, end: { x: 70.5, y: 4 }, fraction: 0 });
  });
  it("50%: конец внизу, дуга не «большая»", () => {
    const a = ringArc(50);
    expect(a.end.x).toBeCloseTo(70.5, 2);
    expect(a.end.y).toBeCloseTo(137, 2);
    expect(a.d).toContain("A 66.5 66.5 0 0 1");
  });
  it("25%: конец справа", () => {
    const a = ringArc(25);
    expect(a.end.x).toBeCloseTo(137, 2);
    expect(a.end.y).toBeCloseTo(70.5, 2);
  });
  it("75%: большая дуга", () => {
    expect(ringArc(75).d).toContain("0 1 1");
  });
  it("100% и перебор: полное кольцо; мусор: 0", () => {
    expect(ringArc(100).fraction).toBe(1);
    expect(ringArc(250).fraction).toBe(1);
    expect(ringArc(250).d).not.toBeNull();
    expect(ringArc(-5).d).toBeNull();
    expect(ringArc(Number.NaN).d).toBeNull();
  });
});

describe("glucoseMarkerSlot", () => {
  it("без данных по центру, иначе в границах 0..14", () => {
    expect(glucoseMarkerSlot(null)).toBe(7);
    expect(glucoseMarkerSlot(1)).toBe(0);
    expect(glucoseMarkerSlot(30)).toBe(14);
    expect(glucoseMarkerSlot(8)).toBe(7);
  });
});

describe("sugarBarViews", () => {
  it("без данных: 24 заглушки h=20", () => {
    const v = sugarBarViews(sugarByHour([], NOW, 0, ZONE));
    expect(v).toHaveLength(24);
    expect(v.every((b) => b.height === 20 && b.tone === "empty")).toBe(true);
  });
  it("высоты нормируются 20..40, цвета по зоне, пропуски внутри суток белые", () => {
    const bars = sugarByHour(
      [pt(NOW - 3_600_000, 5), pt(NOW - 3 * 3_600_000, 9), pt(NOW - 4 * 3_600_000, 3)],
      NOW,
      0,
      ZONE,
    );
    const v = sugarBarViews(bars);
    expect(v[8]).toMatchObject({ height: 20, tone: "alert" }); // 3: ниже нормы, минимум
    expect(v[9]).toMatchObject({ height: 40, tone: "alert" }); // 9: максимум, выше нормы
    expect(v[10]).toMatchObject({ height: 20, tone: "gap" });
    expect(v[11]).toMatchObject({ height: 26.67, tone: "target" }); // 5: треть диапазона 3..9
    expect(v[0]).toMatchObject({ height: 20, tone: "empty" });
    expect(v[23]).toMatchObject({ tone: "empty" });
  });
  it("одно значение: h=30", () => {
    const v = sugarBarViews(sugarByHour([pt(NOW - 3_600_000, 5)], NOW, 0, ZONE));
    expect(v[11].height).toBe(30);
  });
});
