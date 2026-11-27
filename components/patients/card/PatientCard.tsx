"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getPatientAction, type PatientCardData } from "@/app/actions/patients";
import type { PeriodDays } from "@/lib/convexApi";
import { statusLabel } from "@/lib/patientLabels";
import { usePolling } from "@/lib/usePolling";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { HealthStatusBadge } from "../HealthStatusBadge";
import { CardClosed } from "./CardClosed";
import {
  BloodPressureChart,
  GlucoseChart,
  StepsChart,
  WeightChart,
} from "./Charts";
import { MealFeed } from "./MealFeed";
import { Notes } from "./Notes";
import { ProfileTile } from "./ProfileTile";
import { StateTile } from "./StateTile";

const PERIODS: { value: PeriodDays; label: string }[] = [
  { value: 7, label: "7 дней" },
  { value: 30, label: "30 дней" },
  { value: 90, label: "90 дней" },
];

const MEAL_STEP = 7;
const MAX_MEAL_DAYS = 90;

const timeFormat = new Intl.DateTimeFormat("ru-RU", {
  hour: "2-digit",
  minute: "2-digit",
});

function dateKey(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// false на сервере и при гидратации, true после монтирования: даты считаются в часовом поясе браузера.
function useMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

function TilesSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2" aria-hidden>
      <Skeleton className="h-56 rounded-[32px]" />
      <Skeleton className="h-56 rounded-[32px]" />
      <Skeleton className="h-80 rounded-[32px] lg:col-span-2" />
      <Skeleton className="h-80 rounded-[32px] lg:col-span-2" />
    </div>
  );
}

export function PatientCard({
  patientId,
  initialData,
}: {
  patientId: string;
  initialData: PatientCardData;
}) {
  const router = useRouter();
  const mounted = useMounted();
  const [data, setData] = useState<PatientCardData | null>(initialData);
  const [periodDays, setPeriodDays] = useState<PeriodDays>(7);
  const [mealDays, setMealDays] = useState(MEAL_STEP);
  const [unit, setUnit] = useState<"mmol" | "mgdl">("mmol");
  const [closed, setClosed] = useState<"access_closed" | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const lastStatus = useRef(initialData.status.status);

  const { consecutiveErrors } = usePolling({
    fetcher: () => getPatientAction(patientId, periodDays, mealDays),
    key: `${periodDays}-${mealDays}`,
    enabled: closed === null,
    isError: (r) => !("redirect" in r) && !r.ok && r.kind === "error",
    onResult: (r) => {
      if ("redirect" in r) {
        setClosed("access_closed");
        setData(null);
        router.replace(r.redirect);
        return;
      }
      if (!r.ok) {
        // not_found у уже открытой карточки: связь отозвана, данные убираем из состояния (D-10)
        setClosed("access_closed");
        setData(null);
        setAnnouncement("");
        return;
      }
      if (r.data.status.status !== lastStatus.current) {
        lastStatus.current = r.data.status.status;
        setAnnouncement(
          `Состояние пациента изменилось: ${statusLabel(r.data.status.status)}`,
        );
      }
      setData(r.data);
    },
  });

  const name = data?.patient.displayName;
  useEffect(() => {
    if (name) document.title = `${name} — TerenDesk`;
  }, [name]);

  if (closed !== null || data === null)
    return <CardClosed variant="access_closed" />;

  const { series, meals, profile, status } = data;
  const noDataDays =
    status.reason.code === "no_data" ? status.reason.days : undefined;
  const updatedAt = timeFormat.format(new Date(data.generatedAt));
  const hasAnyRecord =
    series.glucose.length > 0 ||
    series.bloodPressure.length > 0 ||
    series.weight.length > 0 ||
    series.steps.some((s) => s.steps > 0) ||
    meals.days.length > 0;

  const now = new Date();
  const todayKey = dateKey(now);
  const yesterdayKey = dateKey(
    new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1),
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <Link
          href="/patients"
          className="w-fit text-sm text-[#0A0D12] underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          ← Пациенты
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[28px] leading-[1.2] font-semibold text-[#0A0D12]">
              {data.patient.displayName}
            </h1>
            <HealthStatusBadge status={status.status} noDataDays={noDataDays} />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <p className="text-sm text-[#5B6270]" suppressHydrationWarning>
              Обновлено {updatedAt}
            </p>
            <div
              role="group"
              aria-label="Период графиков"
              className="flex gap-1 rounded-full bg-[#F4F5F7] p-1"
            >
              {PERIODS.map((p) => {
                const selected = periodDays === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setPeriodDays(p.value)}
                    className={`h-11 rounded-full px-4 text-sm font-semibold text-[#0A0D12] outline-none transition-colors duration-150 focus-visible:ring-3 focus-visible:ring-ring/50 ${
                      selected ? "bg-[#C9F14C]" : "hover:bg-[#E5E7EB]"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div aria-live="polite" className="sr-only">
          {announcement}
        </div>
        {consecutiveErrors > 0 ? (
          <Alert role="status" className="text-[#0A0D12]">
            <span suppressHydrationWarning>
              Не удалось обновить данные. Показаны данные на {updatedAt}.
            </span>
          </Alert>
        ) : null}
      </div>

      {!mounted ? (
        <TilesSkeleton />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ProfileTile profile={profile} linkedAt={data.patient.linkedAt} />
          <StateTile status={status} approximate={data.approximate} />

          {hasAnyRecord ? (
            <>
              <GlucoseChart
                points={series.glucose}
                range={{
                  mmol: series.ranges.glucoseMmol,
                  mgdl: series.ranges.glucoseMgdl,
                }}
                unit={unit}
                onUnitChange={setUnit}
              />
              <BloodPressureChart
                points={series.bloodPressure}
                ranges={{
                  systolic: series.ranges.systolic,
                  diastolic: series.ranges.diastolic,
                }}
              />
              <WeightChart points={series.weight} />
              <StepsChart points={series.steps} goal={series.stepsGoal} />
              <MealFeed
                days={meals.days}
                targets={meals.targets}
                hasMore={meals.hasMore && mealDays < MAX_MEAL_DAYS}
                todayKey={todayKey}
                yesterdayKey={yesterdayKey}
                onShowMore={() =>
                  setMealDays((d) => Math.min(MAX_MEAL_DAYS, d + MEAL_STEP))
                }
                loadingMore={mealDays !== meals.mealDays}
              />
            </>
          ) : (
            <section className="rounded-[32px] bg-[#F7F7F7] p-8 text-[#0A0D12] shadow-sm lg:col-span-2">
              <h2 className="text-xl leading-[1.2] font-semibold">
                Записей пока нет
              </h2>
              <p className="mt-3 max-w-xl text-base leading-normal text-[#5B6270]">
                Пациент ещё не вносил данные. Они появятся здесь после первых
                записей.
              </p>
            </section>
          )}

          <Notes
            patientId={patientId}
            notes={data.notes}
            onNotesChange={(next) =>
              setData((d) => (d ? { ...d, notes: next } : d))
            }
            onAccessLost={() => {
              setClosed("access_closed");
              setData(null);
            }}
          />
        </div>
      )}
    </div>
  );
}
