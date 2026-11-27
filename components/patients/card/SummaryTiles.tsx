import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { GlucosePoint, Macros, MealDay, PatientStatus } from "@/lib/convexApi";
import {
  caloriesSummary,
  glucoseExtremes,
  glucoseValueText,
  scaleIndex,
  sugarByHour,
  type SugarBar,
} from "@/lib/patientSummaryView";
import { formatNumberRu } from "@/lib/mealFeedView";
import { cn } from "@/lib/utils";
import { Avatar } from "../Avatar";
import { HealthStatusBadge } from "../HealthStatusBadge";
import { CalorieRing, MACRO_GRADIENT, MacroBar } from "../NutritionParts";
import { StateTile } from "./StateTile";

const TILE = "rounded-[36px] bg-td-tile p-6 text-td-ink";
const TILE_TITLE = "text-base font-semibold";

const nf1 = new Intl.NumberFormat("ru-RU", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

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
    <section className={cn(TILE, "flex flex-col justify-between gap-3 px-5 py-4")}>
      <div className="flex items-center gap-3">
        <Avatar name={name} />
        <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
          <h2 className="max-w-full text-xl leading-tight font-semibold break-words">{name}</h2>
          <HealthStatusBadge status={status.status} noDataDays={noDataDays} compact />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <StateTile status={status} approximate={approximate} compact />
        <p className="text-[11px] text-td-ink-3" suppressHydrationWarning>
          Обновлено {updatedAt}
        </p>
      </div>
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
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <h2 className={TILE_TITLE}>Сахар за день</h2>
        {!hasAny ? (
          <p className="text-sm text-td-ink-2">За последние 24 часа измерений нет</p>
        ) : null}
      </div>
      {/* 24 столбика показываются и без данных: пустые часы остаются заглушками. */}
      <div
        role="img"
        aria-label={summary}
        className="mt-4 flex h-[140px] items-end justify-between gap-[3px] sm:gap-[10px]"
      >
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
      {hasAny ? (
        <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-td-ink-2">
          <Legend cls="bg-td-bar-target" text="в целевой зоне" />
          <Legend cls="bg-td-bar-high" text="выше цели" />
          <Legend cls="bg-td-bar-norm" text="ниже цели" />
        </p>
      ) : null}
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

export function CaloriesTile({ day, targets }: { day: MealDay | undefined; targets: Macros | null }) {
  const s = caloriesSummary(day, targets);
  const totals = day?.totals ?? { calories: 0, protein: 0, fat: 0, carbs: 0 };
  const goal = (v: number | undefined) => (v === undefined ? null : Math.round(v));
  return (
    <section className={cn(TILE, "flex flex-col")}>
      <h2 className={TILE_TITLE}>Калории</h2>
      <div className="mt-4 flex justify-center">
        <CalorieRing
          size={170}
          stroke={16}
          percent={s.percent}
          remaining={s.remaining}
          numClass="text-[42px]"
          labelClass="text-xs"
        />
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3">
        <MacroBar large label="Белки" value={totals.protein} target={goal(targets?.protein)} gradient={MACRO_GRADIENT.protein} />
        <MacroBar large label="Жиры" value={totals.fat} target={goal(targets?.fat)} gradient={MACRO_GRADIENT.fat} />
        <MacroBar large label="Углеводы" value={totals.carbs} target={goal(targets?.carbs)} gradient={MACRO_GRADIENT.carbs} />
      </div>
      <p className="td-num mt-auto pt-3 text-xs text-td-ink-2">
        Съедено сегодня: {formatNumberRu(s.eaten)}
        {s.target !== null ? ` из ${formatNumberRu(s.target)}` : ""} ккал
      </p>
    </section>
  );
}

// ---------- Глюкоза ----------

const SCALE_TICKS = 25;

function ExtremeTile({
  label,
  value,
  unitText,
  tone,
  Icon,
}: {
  label: string;
  value: string;
  unitText: string;
  tone: "low" | "high";
  Icon: typeof ArrowDownRight;
}) {
  return (
    <div
      className="relative flex min-h-[96px] flex-col justify-between rounded-[24px] p-4 text-[#F3F5F9]"
      style={{
        background: tone === "low" ? "var(--td-glucose-low)" : "var(--td-glucose-high)",
        boxShadow: "var(--td-glucose-glow)",
      }}
    >
      <Icon className="absolute top-3 right-3 size-5" aria-hidden />
      <p className="text-xs font-semibold">{label}</p>
      <p>
        <span className="td-num text-xl font-medium">{value}</span>
        <span className="ml-1 text-xs">{unitText}</span>
      </p>
    </div>
  );
}

// Колонка «Глюкоза»: плитка с текущим значением и под ней пара Низкий/Высокий.
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
  const show = (mmol: number | null) => (mmol === null ? "—" : glucoseValueText(mmol, unit));
  const active = last ? scaleIndex(last.mmol, SCALE_TICKS) : -1;
  return (
    <div className="flex flex-col gap-3">
      <section
        className="flex flex-1 flex-col rounded-[36px] p-6 text-td-ink"
        style={{
          background: "radial-gradient(circle at 50% 40%, rgb(201,165,175), rgb(201,211,216))",
          boxShadow: "inset 0 0 70px #C6D0D7",
        }}
      >
        <h2 className={TILE_TITLE}>Глюкоза</h2>
        <div className="flex flex-1 flex-col items-center justify-center py-3 text-center">
          {/* Белое число на этом градиенте даёт контраст около 2:1 (ниже AA), поэтому текст тёмный. */}
          <p className="td-num text-[60px] leading-none font-medium">{last ? show(last.mmol) : "—"}</p>
          {last ? <p className="mt-1 text-xs text-td-ink-2">{unitText}</p> : null}
        </div>
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
      </section>
      <div className="grid grid-cols-2 gap-3">
        <ExtremeTile label="Низкий" value={show(ext.min)} unitText={unitText} tone="low" Icon={ArrowDownRight} />
        <ExtremeTile label="Высокий" value={show(ext.max)} unitText={unitText} tone="high" Icon={ArrowUpRight} />
      </div>
    </div>
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
