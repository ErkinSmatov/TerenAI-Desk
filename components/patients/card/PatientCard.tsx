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
import { CardClosed } from "./CardClosed";
import {
  BloodPressureChart,
  GlucoseChart,
  StepsChart,
  WeightChart,
} from "./Charts";
import { MealFeed } from "./MealFeed";
import { CaloriesTile, GlucoseTile, PatientTile, SugarDayTile, TileMessage } from "./SummaryTiles";
import { Notes } from "./Notes";
import { ProfileTile } from "./ProfileTile";

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
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3" aria-hidden>
      <Skeleton className="h-56 rounded-[36px]" />
      <Skeleton className="h-56 rounded-[36px] lg:col-span-2" />
      <Skeleton className="h-72 rounded-[36px]" />
      <Skeleton className="h-72 rounded-[36px]" />
      <Skeleton className="h-72 rounded-[36px]" />
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

  const todayMeals = meals.days.find((d) => d.date === todayKey);
  const targets = meals.targets ?? profile.targets;
  const offsetMinutes = -now.getTimezoneOffset();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Link
          href="/patients"
          className="w-fit rounded-full bg-td-pill px-4 py-2 text-sm font-semibold text-td-ink outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          ← Пациенты
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-[40px] leading-[1.1] font-semibold tracking-[-0.6px] text-td-ink max-sm:text-[32px]">
            Сводка по пациенту
          </h1>
          <div
            role="group"
            aria-label="Период графиков"
            className="flex gap-1 rounded-full bg-td-pill p-1"
          >
            {PERIODS.map((p) => {
              const selected = periodDays === p.value;
              return (
                <button
                  key={p.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setPeriodDays(p.value)}
                  className={`h-11 rounded-full px-4 text-sm font-semibold text-td-ink outline-none transition-colors duration-150 focus-visible:ring-3 focus-visible:ring-ring/50 ${
                    selected ? "bg-td-accent" : "hover:bg-td-badge"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>
        <div aria-live="polite" className="sr-only">
          {announcement}
        </div>
        {consecutiveErrors > 0 ? (
          <Alert role="status" className="text-td-ink">
            <span suppressHydrationWarning>
              Не удалось обновить данные. Показаны данные на {updatedAt}.
            </span>
          </Alert>
        ) : null}
      </div>

      {!mounted ? (
        <TilesSkeleton />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <PatientTile
            name={data.patient.displayName}
            status={status}
            updatedAt={updatedAt}
            approximate={data.approximate}
          />
          <SugarDayTile
            points={series.glucose}
            zone={series.ranges.glucoseMmol}
            now={data.generatedAt}
            offsetMinutes={offsetMinutes}
          />
          <CaloriesTile day={todayMeals} targets={targets} />
          <GlucoseTile points={series.glucose} unit={unit} />
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
              <ProfileTile profile={profile} linkedAt={data.patient.linkedAt} />
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
            <>
              <TileMessage title="Записей пока нет">
                Пациент ещё не вносил данные. Они появятся здесь после первых записей.
              </TileMessage>
              <ProfileTile profile={profile} linkedAt={data.patient.linkedAt} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
