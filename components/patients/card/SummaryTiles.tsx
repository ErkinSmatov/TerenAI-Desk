import type { ReactNode } from "react";
import type { GlucosePoint, Macros, MealDay, PatientStatus } from "@/lib/convexApi";
import { formatGlucose } from "@/lib/patientLabels";
import {
  barPercent,
  caloriesSummary,
  glucoseExtremes,
  scaleIndex,
  sugarByHour,
  type SugarBar,
} from "@/lib/patientSummaryView";
import { formatNumberRu } from "@/lib/mealFeedView";
import { cn } from "@/lib/utils";
import { Avatar } from "../Avatar";
import { HealthStatusBadge } from "../HealthStatusBadge";
import { StateTile } from "./StateTile";

const TILE = "rounded-[36px] bg-td-tile p-6 text-td-ink";
const TILE_TITLE = "text-base font-semibold";

const nf1 = new Intl.NumberFormat("ru-RU", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const MGDL = 18;

// ---------- Плитка пациента ----------

export function PatientTile({
  name,
  status,
  updatedAt,
  approximate,
}: {
  name: string;
  status: PatientStatus;
  updatedAt: string;
  approximate: boolean;
}) {
  const noDataDays = status.reason.code === "no_data" ? status.reason.days : undefined;
  return (
    <section className={cn(TILE, "flex flex-col gap-4")}>
      <div className="flex items-center gap-4">
        <Avatar name={name} className="size-[72px] text-2xl" />
        <div className="min-w-0">
          <h2 className="text-xl leading-tight font-semibold break-words">{name}</h2>
          <p className="mt-1 text-xs text-td-ink-3" suppressHydrationWarning>
            Обновлено {updatedAt}
          </p>
        </div>
      </div>
      <div>
        <HealthStatusBadge status={status.status} noDataDays={noDataDays} />
      </div>
      <StateTile status={status} approximate={approximate} />
    </section>
  );
}

// ---------- Сахар за день ----------

const ZONE_CLASS: Record<SugarBar["zone"], string> = {
  none: "bg-td-bar-norm/50",
  low: "bg-td-bar-norm",
  target: "bg-td-bar-target",
  high: "bg-td-bar-high",
};
const ZONE_WORD: Record<SugarBar["zone"], string> = {
  none: "нет данных",
  low: "ниже цели",
  target: "в целевой зоне",
  high: "выше цели",
};
const HOUR_LABELS = [3, 6, 9, 12, 15, 18, 21, 24];

export function SugarDayTile({
  points,
  zone,
  now,
  offsetMinutes,
}: {
  points: GlucosePoint[];
  zone: { min: number; max: number };
  now: number;
  offsetMinutes: number;
}) {
  const bars = sugarByHour(points, now, offsetMinutes, zone);
  const hasAny = bars.some((b) => b.mmol !== null);
  const summary = hasAny
    ? `Сахар за последние 24 часа по часам: ${bars
        .filter((b) => b.mmol !== null)
        .map((b) => `${b.hour}:00 ${nf1.format(b.mmol!)} ммоль/л, ${ZONE_WORD[b.zone]}`)
        .join("; ")}`
    : "Сахар за день: нет измерений";
  return (
    <section className={cn(TILE, "lg:col-span-2")}>
      <h2 className={TILE_TITLE}>Сахар за день</h2>
      {hasAny ? (
        <>
          <div role="img" aria-label={summary} className="mt-4 flex h-[140px] items-end justify-between gap-[3px] sm:gap-[10px]">
            {bars.map((b) => {
              const h = b.mmol === null ? 8 : Math.min(140, Math.max(16, (b.mmol / 14) * 140));
              return (
                <span
                  key={b.hour}
                  aria-hidden
                  title={b.mmol === null ? undefined : `${b.hour}:00, ${nf1.format(b.mmol)} ммоль/л`}
                  className={cn("w-2 shrink-0 rounded-[4px]", ZONE_CLASS[b.zone])}
                  style={{ height: h }}
                />
              );
            })}
          </div>
          <div aria-hidden className="td-num mt-2 flex justify-between text-[10px] text-td-ink-2">
            {HOUR_LABELS.map((h) => (
              <span key={h}>{h}:00</span>
            ))}
          </div>
          <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-td-ink-2">
            <Legend cls="bg-td-bar-target" text="в целевой зоне" />
            <Legend cls="bg-td-bar-high" text="выше цели" />
            <Legend cls="bg-td-bar-norm" text="ниже цели" />
          </p>
        </>
      ) : (
        <p className="mt-4 flex h-[140px] items-center justify-center text-base text-td-ink-2">
          За последние 24 часа измерений нет
        </p>
      )}
    </section>
  );
}

function Legend({ cls, text }: { cls: string; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden className={cn("inline-block size-3 rounded-full ring-1 ring-black/10", cls)} />
      {text}
    </span>
  );
}

// ---------- Калории ----------

const RING_R = 70;
const RING_C = 2 * Math.PI * RING_R;

function MacroBar({
  label,
  value,
  target,
  gradient,
}: {
  label: string;
  value: number;
  target: number | null;
  gradient: string;
}) {
  const pct = barPercent(value, target);
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-semibold">{label}</span>
        <span className="td-num text-td-ink-2">
          {formatNumberRu(value)}
          {target !== null ? `/${formatNumberRu(target)}` : ""}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        className="mt-1 flex h-[9px] items-center rounded-full bg-white px-[2px]"
      >
        <div className="h-[5px] rounded-full" style={{ width: `${pct}%`, background: gradient }} />
      </div>
    </div>
  );
}

export function CaloriesTile({ day, targets }: { day: MealDay | undefined; targets: Macros | null }) {
  const s = caloriesSummary(day, targets);
  const totals = day?.totals ?? { calories: 0, protein: 0, fat: 0, carbs: 0 };
  const offset = RING_C * (1 - s.percent / 100);
  return (
    <section className={TILE}>
      <h2 className={TILE_TITLE}>Калории</h2>
      <div className="mt-4 flex items-center gap-5">
        <div className="relative size-[160px] shrink-0">
          <svg viewBox="0 0 160 160" className="size-full -rotate-90" aria-hidden>
            <circle cx="80" cy="80" r={RING_R} fill="none" stroke="white" strokeWidth="14" />
            <circle
              cx="80"
              cy="80"
              r={RING_R}
              fill="none"
              stroke="var(--td-accent)"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={RING_C}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="td-num text-[42px] leading-none font-medium">
              {s.remaining === null ? "—" : formatNumberRu(s.remaining)}
            </span>
            <span className="mt-1 text-xs text-td-ink-2">{s.remaining !== null && s.remaining < 0 ? "Перебор" : "Осталось"}</span>
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <MacroBar label="Белки" value={totals.protein} target={targets ? Math.round(targets.protein) : null} gradient="var(--td-protein)" />
          <MacroBar label="Жиры" value={totals.fat} target={targets ? Math.round(targets.fat) : null} gradient="var(--td-fat)" />
          <MacroBar label="Углеводы" value={totals.carbs} target={targets ? Math.round(targets.carbs) : null} gradient="var(--td-carbs)" />
        </div>
      </div>
      <p className="td-num mt-3 text-xs text-td-ink-2">
        Съедено сегодня: {formatNumberRu(s.eaten)}
        {s.target !== null ? ` из ${formatNumberRu(s.target)}` : ""} ккал
      </p>
    </section>
  );
}

// ---------- Глюкоза ----------

const SCALE_TICKS = 25;

export function GlucoseTile({
  points,
  unit,
}: {
  points: GlucosePoint[];
  unit: "mmol" | "mgdl";
}) {
  const last = points.length > 0 ? points[points.length - 1] : null;
  const ext = glucoseExtremes(points);
  const unitText = unit === "mmol" ? "ммоль/л" : "мг/дл";
  const show = (mmol: number | null) =>
    mmol === null ? "—" : formatGlucose(mmol, mmol * MGDL, unit);
  const active = last ? scaleIndex(last.mmol, SCALE_TICKS) : -1;
  return (
    <section className={cn(TILE, "flex flex-col gap-4")}>
      <div
        className="flex flex-1 flex-col justify-between rounded-[28px] p-5"
        style={{
          background: "radial-gradient(circle at 50% 40%, rgb(201,165,175), rgb(201,211,216))",
          boxShadow: "inset 0 0 70px #C6D0D7",
        }}
      >
        <div className="flex items-baseline justify-between">
          <h2 className={TILE_TITLE}>Глюкоза</h2>
          <span className="text-xs text-td-ink-2">{unitText}</span>
        </div>
        {/* Белое число на этом градиенте даёт контраст около 2:1 (ниже AA), поэтому текст тёмный. */}
        <p className="td-num my-3 text-[60px] leading-none font-medium text-td-ink">
          {last ? show(last.mmol) : "—"}
        </p>
        <div aria-hidden className="flex h-10 items-center justify-between">
          {Array.from({ length: SCALE_TICKS }, (_, i) => (
            <span
              key={i}
              className={cn(
                "shrink-0 rounded-[1px]",
                i === active ? "h-10 w-2 bg-td-accent" : "h-5 w-[2px] bg-td-ink/40",
              )}
            />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div
          className="rounded-3xl px-4 py-3"
          style={{ background: "var(--td-glucose-low)", boxShadow: "inset 0 0 62px white" }}
        >
          <p className="text-xs font-semibold text-td-ink">Низкий</p>
          <p className="td-num text-xl font-medium text-td-ink">{show(ext.min)}</p>
        </div>
        <div
          className="rounded-3xl px-4 py-3"
          style={{ background: "var(--td-glucose-high)", boxShadow: "inset 0 0 62px white" }}
        >
          <p className="text-xs font-semibold text-td-ink">Высокий</p>
          <p className="td-num text-xl font-medium text-td-ink">{show(ext.max)}</p>
        </div>
      </div>
    </section>
  );
}

export function TileMessage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={cn(TILE, "lg:col-span-3")}>
      <h2 className="text-xl leading-[1.2] font-semibold">{title}</h2>
      <p className="mt-3 max-w-xl text-base leading-normal text-td-ink-2">{children}</p>
    </section>
  );
}
