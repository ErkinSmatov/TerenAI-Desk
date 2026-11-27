"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, Droplet, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { listPatientsAction, type PatientListData } from "@/app/actions/patients";
import type { BpSample, GlucoseSample, PatientListRow } from "@/lib/convexApi";
import { countPatients, filterPatients, paginate, relativeTime, sortPatients, type SortMode } from "@/lib/patientListView";
import { formatGlucose } from "@/lib/patientLabels";
import { usePolling } from "@/lib/usePolling";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar } from "./Avatar";
import { HealthStatusBadge } from "./HealthStatusBadge";

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
  return formatGlucose(mmol, mmol * MGDL_PER_MMOL, "mmol");
}

function bpText(sample: BpSample): string {
  return `${sample.systolic}/${sample.diastolic}`;
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
    <ul aria-label="Сводка по пациентам" className="flex flex-wrap gap-3">
      {items.map((i) => (
        <li
          key={i.label}
          className={cn("flex items-center gap-3 rounded-[24px] px-5 py-3 text-td-ink", i.cls)}
        >
          <span className="td-num text-[40px] leading-none font-medium">{i.value}</span>
          <span className="text-sm font-semibold">{i.label}</span>
        </li>
      ))}
    </ul>
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
      <p className="text-sm text-td-ink-2" suppressHydrationWarning>
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
        <div className="rounded-[36px] bg-td-tile p-8 text-td-ink">
          <h3 className="text-xl leading-[1.2] font-semibold">Активных пациентов пока нет</h3>
          <p className="mt-3 max-w-xl text-base leading-normal text-td-ink-2">
            Пациент появится здесь, когда подтвердит подключение к вам. Подключить пациента можно
            кнопкой «Подключить пациента».
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
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
                className="h-11 rounded-full border-0 bg-td-pill pl-9"
              />
            </div>
            <Select
              value={sort}
              onValueChange={(v) => {
                setSort(v as SortMode);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-11 w-full rounded-full border-0 bg-td-pill sm:w-60" aria-label="Сортировка">
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
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                {items.map((row) => {
                  const last = lastDataText(row, now);
                  const critical = row.status.status === "critical";
                  return (
                    <li
                      key={row.patientId}
                      className="relative flex flex-col gap-1 has-[a:focus-visible]:ring-3 has-[a:focus-visible]:ring-ring/50 rounded-3xl"
                    >
                      <div
                        className="flex flex-col gap-4 rounded-t-3xl rounded-b-lg bg-td-tile p-5"
                        style={critical ? { boxShadow: "var(--td-shadow-critical-top)" } : undefined}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar name={row.displayName} />
                          <Link
                            href={`/patients/${row.patientId}`}
                            className="min-w-0 flex-1 truncate text-base font-semibold outline-none after:absolute after:inset-0 after:content-['']"
                          >
                            {row.displayName}
                          </Link>
                        </div>
                        <div className="flex items-center justify-between gap-3 rounded-2xl bg-td-badge px-4 py-3">
                          <span className="flex items-center gap-2 text-xs font-medium text-td-ink-2">
                            <Droplet className="size-4" aria-hidden />
                            Глюкоза
                          </span>
                          <span className="td-num text-xl font-medium">
                            {row.lastGlucose ? glucoseText(row.lastGlucose) : "—"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3 rounded-2xl bg-td-badge px-4 py-3">
                          <span className="flex items-center gap-2 text-xs font-medium text-td-ink-2">
                            <Activity className="size-4" aria-hidden />
                            Давление
                          </span>
                          <span className="td-num text-xl font-medium">
                            {row.lastBloodPressure ? bpText(row.lastBloodPressure) : "—"}
                          </span>
                        </div>
                      </div>
                      <div
                        className="flex flex-wrap items-center justify-between gap-2 rounded-t-lg rounded-b-3xl bg-td-tile px-5 py-4"
                        style={critical ? { boxShadow: "var(--td-shadow-critical-bottom)" } : undefined}
                      >
                        <HealthStatusBadge
                          status={row.status.status}
                          noDataDays={noDataDays(row)}
                        />
                        <span className="text-xs text-td-ink-2">
                          <span title={last.title} suppressHydrationWarning>
                            {last.text}
                          </span>
                        </span>
                      </div>
                    </li>
                  );
                })}
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
