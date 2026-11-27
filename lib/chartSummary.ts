// Сводка и подписи осей для графиков карточки пациента (чистые функции).

export type ChartSummary = { min: number | null; max: number | null; last: number | null };

export function summarize(values: number[], last: number | null): ChartSummary {
  if (values.length === 0) return { min: null, max: null, last };
  let min = values[0];
  let max = values[0];
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return { min, max, last };
}

// Не больше `max` равномерно выбранных меток; первая и последняя сохраняются.
export function xTicks(timestamps: number[], max = 7): number[] {
  const n = timestamps.length;
  if (n <= max) return [...timestamps];
  if (max <= 1) return [timestamps[0]];
  const result: number[] = [];
  for (let i = 0; i < max; i += 1) {
    result.push(timestamps[Math.round((i * (n - 1)) / (max - 1))]);
  }
  return result;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

// «дд.мм» в часовом поясе со смещением offsetMinutes от UTC (по умолчанию UTC).
export function formatDayMonth(ms: number, offsetMinutes = 0): string {
  const d = new Date(ms + offsetMinutes * 60_000);
  return `${pad2(d.getUTCDate())}.${pad2(d.getUTCMonth() + 1)}`;
}

// «дд.мм ЧЧ:мм» для подсказок и таблиц.
export function formatDayMonthTime(ms: number, offsetMinutes = 0): string {
  const d = new Date(ms + offsetMinutes * 60_000);
  return `${formatDayMonth(ms, offsetMinutes)} ${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`;
}
