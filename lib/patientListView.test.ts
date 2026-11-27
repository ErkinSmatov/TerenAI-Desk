import { describe, expect, it } from "vitest";
import type { HealthStatus, PatientListRow } from "./convexApi";
import { countPatients, filterPatients, initialsOf, paginate, relativeTime, sortPatients } from "./patientListView";

function row(displayName: string, status: HealthStatus, lastRecordAt: number | null = 1000): PatientListRow {
  return {
    patientId: displayName as PatientListRow["patientId"],
    displayName,
    status: { status, reason: { code: "in_range" }, lastRecordAt },
    approximate: false,
    lastGlucose: null,
    lastBloodPressure: null,
    caloriesEaten: 0,
    caloriesGoal: null,
    macros: { protein: 0, fat: 0, carbs: 0 },
    macroGoals: null,
    steps: 0,
    stepsGoal: 8000,
  };
}

describe("filterPatients", () => {
  const rows = [row("Алена Ким", "ok"), row("Борис", "ok")];
  it("игнорирует регистр и ё/е", () => {
    expect(filterPatients(rows, "алёна").map((r) => r.displayName)).toEqual(["Алена Ким"]);
    expect(filterPatients(rows, "БОР")).toHaveLength(1);
  });
  it("пустой запрос возвращает всё", () => {
    expect(filterPatients(rows, "  ")).toHaveLength(2);
  });
});

describe("sortPatients", () => {
  it("critical_first: critical, warning, no_data, ok", () => {
    const rows = [row("А", "ok"), row("Б", "critical"), row("В", "no_data"), row("Г", "warning")];
    expect(sortPatients(rows, "critical_first").map((r) => r.displayName)).toEqual(["Б", "Г", "В", "А"]);
  });
  it("by_name", () => {
    const rows = [row("Б", "ok"), row("А", "critical")];
    expect(sortPatients(rows, "by_name").map((r) => r.displayName)).toEqual(["А", "Б"]);
  });
  it("by_staleness: null первыми, затем самые давние", () => {
    const rows = [row("А", "ok", 500), row("Б", "ok", null), row("В", "ok", 100)];
    expect(sortPatients(rows, "by_staleness").map((r) => r.displayName)).toEqual(["Б", "В", "А"]);
  });
  it("не мутирует вход", () => {
    const rows = [row("Б", "ok"), row("А", "ok")];
    sortPatients(rows, "by_name");
    expect(rows[0].displayName).toBe("Б");
  });
});

describe("paginate", () => {
  const rows = Array.from({ length: 26 }, (_, i) => row(`П${i}`, "ok"));
  it("делит на страницы по 25", () => {
    expect(paginate(rows, 1).pages).toBe(2);
    expect(paginate(rows, 2).items).toHaveLength(1);
  });
  it("страница вне диапазона приводится к последней", () => {
    expect(paginate(rows, 9).page).toBe(2);
    expect(paginate(rows, 0).page).toBe(1);
  });
  it("пустой список — одна страница", () => {
    expect(paginate([], 1)).toEqual({ items: [], page: 1, pages: 1 });
  });
});

describe("relativeTime", () => {
  const now = 10_000_000_000;
  it("только что", () => expect(relativeTime(now - 30_000, now)).toBe("только что"));
  it("минуты", () => expect(relativeTime(now - 12 * 60_000, now)).toBe("12 мин назад"));
  it("часы", () => expect(relativeTime(now - (130 * 60_000), now)).toBe("2 ч назад"));
  it("дни", () => expect(relativeTime(now - 3 * 86_400_000, now)).toBe("3 дн. назад"));
});

describe("countPatients", () => {
  it("раскладывает по статусам, «нет данных» отдельно", () => {
    const rows = [row("А", "ok"), row("Б", "ok"), row("В", "critical"), row("Г", "warning"), row("Д", "no_data")];
    expect(countPatients(rows)).toEqual({ total: 5, optimal: 2, critical: 1, attention: 1, noData: 1 });
  });
  it("пустой список", () => {
    expect(countPatients([])).toEqual({ total: 0, optimal: 0, critical: 0, attention: 0, noData: 0 });
  });
});

describe("initialsOf", () => {
  it("берёт первые буквы двух слов", () => {
    expect(initialsOf("анна Ким Ли")).toBe("АК");
    expect(initialsOf("Борис")).toBe("Б");
    expect(initialsOf("  ")).toBe("?");
  });
});
