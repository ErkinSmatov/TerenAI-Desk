import { describe, expect, it } from "vitest";
import { caloriesProgress, dayHeading, formatMacros, formatNumberRu } from "./mealFeedView";

describe("dayHeading", () => {
  it("сегодня, вчера и дата", () => {
    expect(dayHeading("2026-11-27", "2026-11-27", "2026-11-26")).toBe("Сегодня");
    expect(dayHeading("2026-11-26", "2026-11-27", "2026-11-26")).toBe("Вчера");
    expect(dayHeading("2026-11-12", "2026-11-27", "2026-11-26")).toBe("12 ноября");
    expect(dayHeading("2026-03-01", "2026-11-27", "2026-11-26")).toBe("1 марта");
  });
});

describe("caloriesProgress", () => {
  it("процент без перерасхода", () => {
    expect(caloriesProgress(1840, 2100)).toEqual({ percent: 88, overText: null });
  });
  it("перерасход", () => {
    const r = caloriesProgress(2220, 2100);
    expect(r.percent).toBe(100);
    expect(r.overText?.replace(/\s/g, " ")).toBe("+120 ккал");
  });
  it("нет нормы", () => {
    expect(caloriesProgress(500, null)).toEqual({ percent: 0, overText: null });
  });
});

describe("formatMacros", () => {
  it("форматирует БЖУ", () => {
    expect(formatMacros({ protein: 92, fat: 61, carbs: 180 })).toBe("Б 92 · Ж 61 · У 180 г");
  });
});

describe("formatNumberRu", () => {
  it("разделяет тысячи", () => {
    expect(formatNumberRu(1840).replace(/\s/g, " ")).toBe("1 840");
  });
});
