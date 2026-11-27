"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Footprints, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { listPatientsAction, type PatientListData } from "@/app/actions/patients";
import type { GlucoseSample, PatientListRow } from "@/lib/convexApi";
import { countPatients, filterPatients, paginate, relativeTime, sortPatients, type SortMode } from "@/lib/patientListView";
import { barPercent, glucoseValueText } from "@/lib/patientSummaryView";
import { formatNumberRu } from "@/lib/mealFeedView";
import { usePolling } from "@/lib/usePolling";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar } from "./Avatar";
import { HealthStatusBadge } from "./HealthStatusBadge";
import { CalorieRing, MACRO_GRADIENT, MacroBar } from "./NutritionParts";

const MGDL_PER_MMOL = 18;

const timeFormat = new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" });
const dateTimeFormat = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const SORT_LABELS: Record<SortMode, string> = {
  critical_first: "Сначала критичные",
  by_name: "По имени",
  by_staleness: "По давности данных",
};

function glucoseText(sample: GlucoseSample): string {
  const mmol = sample.unit === "mg/dL" ? sample.value / MGDL_PER_MMOL : sample.value;
  return glucoseValueText(mmol, "mmol");
}

function noDataDays(row: PatientListRow): number | undefined {
  return row.status.reason.code === "no_data" ? row.status.reason.days : undefined;
}

function lastDataText(row: PatientListRow, now: number): { text: string; title?: string } {
  const at = row.status.lastRecordAt;
  if (at === null) return { text: "—" };
  return { text: relativeTime(at, now), title: dateTimeFormat.format(new Date(at)) };
}

function CounterRow({ rows }: { rows: PatientListRow[] }) {
  const c = countPatients(rows);
  const items = [
    { label: "Пациентов", value: c.total, cls: "bg-td-accent" },
    { label: "Оптимальных", value: c.optimal, cls: "bg-td-tile" },
    {
      label: "Критичных",
      value: c.critical,
      cls: "bg-td-bg shadow-[inset_0_0_12px_rgba(228,0,5,0.25)]",
    },
    { label: "На рассмотрении", value: c.attention, cls: "bg-[#D1D1D1]" },
    { label: "Нет данных", value: c.noData, cls: "bg-td-pill" },
  ];
  return (
    <ul aria-label="Сводка по пациентам" className="flex flex-wrap items-center gap-x-8 gap-y-3">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-3 text-td-ink">
          <span className="td-num text-[40px] leading-none font-medium">{i.value}</span>
          <span className={cn("rounded-[12px] px-3 py-1.5 text-xs font-semibold", i.cls)}>
            {i.label}
          </span>
        </li>
      ))}
    </ul>
  );
}

const BLOCK_SHADOW_TOP = { boxShadow: "var(--td-shadow-critical-top)" };
const BLOCK_SHADOW_BOTTOM = { boxShadow: "var(--td-shadow-critical-bottom)" };

// Карточка пациента: два слитых блока радиусом 24px (макет 1479:719).
function PatientCardTile({ row, now }: { row: PatientListRow; now: number }) {
  const last = lastDataText(row, now);
  const critical = row.status.status === "critical";
  const remaining = row.caloriesGoal === null ? null : Math.round(row.caloriesGoal - row.caloriesEaten);
  const caloriesPct = row.caloriesGoal === null ? 0 : barPercent(row.caloriesEaten, row.caloriesGoal);
  const stepsPct = barPercent(row.steps, row.stepsGoal);
  const goals = row.macroGoals;
  const goal = (v: number | undefined) => (v === undefined ? null : Math.round(v));
  return (
    <li className="relative flex flex-col rounded-[24px] has-[a:focus-visible]:ring-3 has-[a:focus-visible]:ring-ring/50">
      <div
        className="flex flex-col gap-4 rounded-t-[24px] bg-td-tile p-5"
        style={critical ? BLOCK_SHADOW_TOP : undefined}
      >
        <div className="flex items-center gap-3">
          <Avatar name={row.displayName} />
          <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
            <Link
              href={`/patients/${row.patientId}`}
              className="max-w-full truncate text-base font-semibold outline-none after:absolute after:inset-0 after:content-['']"
            >
              {row.displayName}
            </Link>
            <HealthStatusBadge status={row.status.status} noDataDays={noDataDays(row)} compact />
          </div>
        </div>
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-td-ink-2">Калорий</span>
            <span className="td-num text-xl leading-tight font-medium">
              {formatNumberRu(row.caloriesEaten)}
            </span>
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <Footprints className="size-4 shrink-0 text-td-ink-2" aria-hidden />
              <div
                role="progressbar"
                aria-label="Шаги"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(stepsPct)}
                className="flex h-[9px] flex-1 items-center rounded-full bg-white px-[2px]"
              >
                {stepsPct > 0 ? (
                  <div
                    className="h-[5px] rounded-full"
                    style={{ width: `${stepsPct}%`, background: "var(--td-steps)" }}
                  />
                ) : null}
              </div>
            </div>
            <span className="td-num text-center text-[11px] text-td-ink-2">
              {formatNumberRu(row.steps)} / {formatNumberRu(row.stepsGoal)} шагов
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[11px] font-semibold text-td-ink-2">Глюкоза</span>
            <span className="td-num text-xl leading-tight font-medium">
              {row.lastGlucose ? glucoseText(row.lastGlucose) : "—"}
            </span>
          </div>
        </div>
      </div>
      <div
        className="flex flex-col gap-3 rounded-b-[24px] bg-td-tile px-5 pt-1 pb-5"
        style={critical ? BLOCK_SHADOW_BOTTOM : undefined}
      >
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-base font-semibold">Калории</span>
            <span className="text-[11px] text-td-ink-2" title={last.title} suppressHydrationWarning>
              {last.text}
            </span>
          </div>
          <div className="ml-auto">
            <CalorieRing
              size={92}
              stroke={10}
              percent={caloriesPct}
              remaining={remaining}
              numClass="text-xl"
              labelClass="text-[11px]"
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <MacroBar label="Белки" value={row.macros.protein} target={goal(goals?.protein)} gradient={MACRO_GRADIENT.protein} />
          <MacroBar label="Жиры" value={row.macros.fat} target={goal(goals?.fat)} gradient={MACRO_GRADIENT.fat} />
          <MacroBar label="Углеводы" value={row.macros.carbs} target={goal(goals?.carbs)} gradient={MACRO_GRADIENT.carbs} />
        </div>
      </div>
    </li>
  );
}

export function PatientList({ initialData }: { initialData: PatientListData }) {
  const router = useRouter();
  const [data, setData] = useState<PatientListData>(initialData);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("critical_first");
  const [page, setPage] = useState(1);
  const [stopped, setStopped] = useState(false);

  // Пока фокус внутри списка, свежие данные откладываются, чтобы строки не «прыгали» под фокусом.
  const containerRef = useRef<HTMLDivElement>(null);
  const focusInside = useRef(false);
  const deferred = useRef<PatientListData | null>(null);

  const { consecutiveErrors } = usePolling({
    fetcher: listPatientsAction,
    isError: (r) => !("redirect" in r) && !r.ok,
    enabled: !stopped,
    onResult: (r) => {
      if ("redirect" in r) {
        setStopped(true);
        router.replace(r.redirect);
        return;
      }
      if (!r.ok) return;
      if (focusInside.current) {
        deferred.current = r.data;
      } else {
        setData(r.data);
      }
    },
  });

  function handleFocus() {
    focusInside.current = true;
  }

  function handleBlur(event: React.FocusEvent<HTMLDivElement>) {
    if (containerRef.current?.contains(event.relatedTarget as Node | null)) return;
    focusInside.current = false;
    if (deferred.current) {
      setData(deferred.current);
      deferred.current = null;
    }
  }

  const filtered = filterPatients(data.rows, query);
  const sorted = sortPatients(filtered, sort);
  const { items, page: currentPage, pages } = paginate(sorted, page);
  const now = data.generatedAt;
  const updatedAt = timeFormat.format(new Date(data.generatedAt));

  return (
    <div ref={containerRef} onFocus={handleFocus} onBlur={handleBlur} className="flex flex-col gap-5">
      <CounterRow rows={data.rows} />
      <p className="-mt-3 text-xs text-td-ink-3" suppressHydrationWarning>
        Обновлено {updatedAt}
      </p>

      {consecutiveErrors > 0 ? (
        <Alert role="status" className="text-[#0A0D12]">
          <span suppressHydrationWarning>
            Не удалось обновить данные. Показаны данные на {updatedAt}.
          </span>
        </Alert>
      ) : null}

      {data.rows.length === 0 ? (
        <div className="rounded-[24px] bg-td-tile p-8 text-td-ink">
          <h3 className="text-xl leading-[1.2] font-semibold">Активных пациентов пока нет</h3>
          <p className="mt-3 max-w-xl text-base leading-normal text-td-ink-2">
            Пациент появится здесь, когда подтвердит подключение к вам. Подключить пациента можно
            кнопкой «Подключить пациента».
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <div className="relative sm:w-72">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-td-ink-2"
                aria-hidden
              />
              <Input
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Поиск по имени"
                aria-label="Поиск по имени"
                className="h-10 rounded-full border-0 bg-td-pill pl-9 text-sm"
              />
            </div>
            <Select
              value={sort}
              onValueChange={(v) => {
                setSort(v as SortMode);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-10 w-full rounded-full border-0 bg-td-pill text-sm sm:w-56" aria-label="Сортировка">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(SORT_LABELS) as SortMode[]).map((mode) => (
                  <SelectItem key={mode} value={mode}>
                    {SORT_LABELS[mode]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {sorted.length === 0 ? (
            <p className="py-6 text-base text-td-ink-2">
              Никого не нашли. Проверьте написание имени или очистите поиск.
            </p>
          ) : (
            <>
              <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {items.map((row) => (
                  <PatientCardTile key={row.patientId} row={row} now={now} />
                ))}
              </ul>

              {pages > 1 ? (
                <div className="flex items-center justify-between gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-full border-0 bg-td-pill px-5 font-semibold"
                    disabled={currentPage <= 1}
                    onClick={() => setPage(currentPage - 1)}
                  >
                    Назад
                  </Button>
                  <span className="text-sm text-td-ink-2 tabular-nums">
                    Страница {currentPage} из {pages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-full border-0 bg-td-pill px-5 font-semibold"
                    disabled={currentPage >= pages}
                    onClick={() => setPage(currentPage + 1)}
                  >
                    Далее
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </>
      )}

      {data.truncated ? (
        <p className="text-sm text-td-ink-2">Показаны первые 200 пациентов</p>
      ) : null}
    </div>
  );
}
