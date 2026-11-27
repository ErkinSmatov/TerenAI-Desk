"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { listPatientsAction, type PatientListData } from "@/app/actions/patients";
import type { BpSample, GlucoseSample, PatientListRow } from "@/lib/convexApi";
import { filterPatients, paginate, relativeTime, sortPatients, type SortMode } from "@/lib/patientListView";
import { formatGlucose } from "@/lib/patientLabels";
import { usePolling } from "@/lib/usePolling";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

function patientsCount(n: number): string {
  const mod100 = n % 100;
  const mod10 = n % 10;
  if (mod100 >= 11 && mod100 <= 14) return `${n} пациентов`;
  if (mod10 === 1) return `${n} пациент`;
  if (mod10 >= 2 && mod10 <= 4) return `${n} пациента`;
  return `${n} пациентов`;
}

function glucoseText(sample: GlucoseSample): string {
  const mmol = sample.unit === "mg/dL" ? sample.value / MGDL_PER_MMOL : sample.value;
  return formatGlucose(mmol, mmol * MGDL_PER_MMOL, "mmol");
}

function bpText(sample: BpSample): string {
  return `${sample.systolic}/${sample.diastolic}`;
}

function metricsText(row: PatientListRow): string {
  const parts: string[] = [];
  if (row.lastGlucose) parts.push(glucoseText(row.lastGlucose));
  if (row.lastBloodPressure) parts.push(bpText(row.lastBloodPressure));
  return parts.length > 0 ? parts.join(" · ") : "—";
}

function noDataDays(row: PatientListRow): number | undefined {
  return row.status.reason.code === "no_data" ? row.status.reason.days : undefined;
}

function lastDataText(row: PatientListRow, now: number): { text: string; title?: string } {
  const at = row.status.lastRecordAt;
  if (at === null) return { text: "—" };
  return { text: relativeTime(at, now), title: dateTimeFormat.format(new Date(at)) };
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
    <div ref={containerRef} onFocus={handleFocus} onBlur={handleBlur} className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm text-[#5B6270]" suppressHydrationWarning>
          Обновлено {updatedAt}
        </p>
        <p className="text-sm text-[#5B6270] tabular-nums">{patientsCount(data.rows.length)}</p>
      </div>

      {consecutiveErrors > 0 ? (
        <Alert role="status" className="text-[#0A0D12]">
          <span suppressHydrationWarning>
            Не удалось обновить данные. Показаны данные на {updatedAt}.
          </span>
        </Alert>
      ) : null}

      {data.rows.length === 0 ? (
        <div className="rounded-[32px] bg-[#F7F7F7] p-8 text-[#0A0D12] shadow-sm">
          <h3 className="text-xl leading-[1.2] font-semibold">Активных пациентов пока нет</h3>
          <p className="mt-3 max-w-xl text-base leading-normal text-[#5B6270]">
            Пациент появится здесь, когда подтвердит подключение к вам. Подключить пациента можно
            кнопкой «Подключить пациента».
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#5B6270]"
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
                className="h-11 pl-9"
              />
            </div>
            <Select
              value={sort}
              onValueChange={(v) => {
                setSort(v as SortMode);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-11 w-full sm:w-60" aria-label="Сортировка">
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
            <p className="py-6 text-base text-[#5B6270]">
              Никого не нашли. Проверьте написание имени или очистите поиск.
            </p>
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Пациент</TableHead>
                      <TableHead>Состояние</TableHead>
                      <TableHead>Последние данные</TableHead>
                      <TableHead>Показатели</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((row) => {
                      const last = lastDataText(row, now);
                      return (
                        <TableRow
                          key={row.patientId}
                          className="relative min-h-16 hover:bg-[#F4F5F7] has-[a:focus-visible]:ring-3 has-[a:focus-visible]:ring-ring/50"
                        >
                          <TableCell className="h-16 py-4 text-base font-semibold">
                            <Link
                              href={`/patients/${row.patientId}`}
                              className="outline-none after:absolute after:inset-0 after:content-['']"
                            >
                              {row.displayName}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <HealthStatusBadge
                              status={row.status.status}
                              noDataDays={noDataDays(row)}
                            />
                          </TableCell>
                          <TableCell className="text-sm text-[#5B6270]">
                            <span title={last.title} suppressHydrationWarning>
                              {last.text}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm tabular-nums">{metricsText(row)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <ul className="flex flex-col gap-3 md:hidden">
                {items.map((row) => {
                  const last = lastDataText(row, now);
                  return (
                    <li key={row.patientId}>
                      <Link
                        href={`/patients/${row.patientId}`}
                        className="flex min-h-16 flex-col gap-2 rounded-2xl bg-[#F7F7F7] p-4 hover:bg-[#F4F5F7] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                      >
                        <span className="text-base font-semibold">{row.displayName}</span>
                        <span>
                          <HealthStatusBadge
                            status={row.status.status}
                            noDataDays={noDataDays(row)}
                          />
                        </span>
                        <span className="text-sm text-[#5B6270]">
                          <span title={last.title} suppressHydrationWarning>
                            {last.text}
                          </span>
                          {" · "}
                          <span className="tabular-nums">{metricsText(row)}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>

              {pages > 1 ? (
                <div className="flex items-center justify-between gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-full px-5 font-semibold"
                    disabled={currentPage <= 1}
                    onClick={() => setPage(currentPage - 1)}
                  >
                    Назад
                  </Button>
                  <span className="text-sm text-[#5B6270] tabular-nums">
                    Страница {currentPage} из {pages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-full px-5 font-semibold"
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
        <p className="text-sm text-[#5B6270]">Показаны первые 200 пациентов</p>
      ) : null}
    </div>
  );
}
