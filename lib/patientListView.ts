import type { HealthStatus, PatientListRow } from "./convexApi";

// Чистая логика списка пациентов: фильтр, сортировка, пагинация, относительное время.
export type SortMode = "critical_first" | "by_name" | "by_staleness";

export const PAGE_SIZE = 25;

const SEVERITY: Record<HealthStatus, number> = {
  critical: 0,
  warning: 1,
  no_data: 2,
  ok: 3,
};

function normalize(value: string): string {
  return value.toLocaleLowerCase("ru").replaceAll("ё", "е").trim();
}

function byName(a: PatientListRow, b: PatientListRow): number {
  return a.displayName.localeCompare(b.displayName, "ru");
}

export function filterPatients(rows: PatientListRow[], query: string): PatientListRow[] {
  const q = normalize(query);
  if (q === "") return rows;
  return rows.filter((r) => normalize(r.displayName).includes(q));
}

export function sortPatients(rows: PatientListRow[], mode: SortMode): PatientListRow[] {
  const copy = [...rows];
  switch (mode) {
    case "by_name":
      return copy.sort(byName);
    case "by_staleness":
      return copy.sort((a, b) => {
        const ta = a.status.lastRecordAt;
        const tb = b.status.lastRecordAt;
        if (ta === tb) return byName(a, b);
        if (ta === null) return -1;
        if (tb === null) return 1;
        return ta - tb || byName(a, b);
      });
    case "critical_first":
      return copy.sort(
        (a, b) => SEVERITY[a.status.status] - SEVERITY[b.status.status] || byName(a, b),
      );
  }
}

export function paginate<T>(
  rows: T[],
  page: number,
  size: number = PAGE_SIZE,
): { items: T[]; page: number; pages: number } {
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const current = Math.min(Math.max(1, Math.floor(page) || 1), pages);
  return { items: rows.slice((current - 1) * size, current * size), page: current, pages };
}

export function relativeTime(ms: number, now: number): string {
  const diff = Math.max(0, now - ms);
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "только что";
  if (minutes < 60) return `${minutes} мин назад`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч назад`;
  return `${Math.floor(hours / 24)} дн. назад`;
}
