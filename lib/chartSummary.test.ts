import { describe, expect, it } from "vitest";
import { formatDayMonth, formatDayMonthTime, summarize, xTicks } from "./chartSummary";

describe("summarize", () => {
  it("пустой набор даёт null", () => {
    expect(summarize([], null)).toEqual({ min: null, max: null, last: null });
  });
  it("считает минимум, максимум и последнее", () => {
    expect(summarize([5, 9, 7], 7)).toEqual({ min: 5, max: 9, last: 7 });
  });
});

describe("xTicks", () => {
  it("30 меток сводятся к 7 с первой и последней", () => {
    const ts = Array.from({ length: 30 }, (_, i) => i * 1000);
    const ticks = xTicks(ts);
    expect(ticks).toHaveLength(7);
    expect(ticks[0]).toBe(0);
    expect(ticks[6]).toBe(29000);
  });
  it("3 метки остаются 3", () => {
    expect(xTicks([1, 2, 3])).toEqual([1, 2, 3]);
  });
});

describe("formatDayMonth", () => {
  it("форматирует дд.мм", () => {
    expect(formatDayMonth(Date.UTC(2026, 10, 12, 9, 0))).toBe("12.11");
  });
  it("учитывает смещение", () => {
    expect(formatDayMonth(Date.UTC(2026, 10, 12, 23, 0), 120)).toBe("13.11");
  });
  it("время в подсказке", () => {
    expect(formatDayMonthTime(Date.UTC(2026, 10, 12, 9, 5))).toBe("12.11 09:05");
  });
});
