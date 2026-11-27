import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { GlucosePoint, Macros, MealDay, PatientStatus } from "@/lib/convexApi";
import {
  caloriesSummary,
  GLUCOSE_TICKS,
  glucoseExtremes,
  glucoseMarkerSlot,
  glucoseValueText,
  sugarBarViews,
  sugarByHour,
  type SugarBarTone,
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

const TONE_CLASS: Record<SugarBarTone, string> = {
  empty: "bg-[rgba(255,254,253,0.5)]",
  gap: "bg-td-bar-norm",
  target: "bg-td-bar-target",
  alert: "bg-td-bar-high",
};
const ZONE_WORD = {
  none: "нет данных",
  low: "ниже нормы",
  target: "в норме",
  high: "выше нормы",
} as const;
const HOUR_LABELS = [3, 6, 9, 12, 15, 18, 21, 24];

// Плитка 712x100 (Figma 1494:5741): 24 столбика по часам, высота 20..40px по значению.
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
  const bars = sugarBarViews(sugarByHour(points, now, offsetMinutes, zone));
  const hasAny = bars.some((b) => b.mmol !== null);
  const summary = hasAny
    ? `Сахар за последние 24 часа по часам: ${bars
        .filter((b) => b.mmol !== null)
        .map((b) => `${b.hour}:00 ${nf1.format(b.mmol!)} ммоль/л, ${ZONE_WORD[b.zone]}`)
        .join("; ")}`
    : "Сахар за день: нет измерений";
  return (
    <section className={cn(TILE, "flex min-h-[100px] flex-col px-7 py-2 lg:col-span-2")}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <h2 className="text-base font-semibold text-td-ink">Сахар за день</h2>
        {!hasAny ? <p className="text-xs text-td-ink-2">За последние 24 часа измерений нет</p> : null}
      </div>
      {/* 24 столбика остаются и без данных: заглушки h=20. */}
      <div role="img" aria-label={summary} className="mt-1 flex h-10 items-end justify-between">
        {bars.map((b) => (
          <span
            key={b.hour}
            aria-hidden
            title={b.mmol === null ? undefined : `${b.hour}:00, ${nf1.format(b.mmol)} ммоль/л`}
            className={cn("w-2 shrink-0 rounded-[4px]", TONE_CLASS[b.tone])}
            style={{ height: b.height }}
          />
        ))}
      </div>
      <div aria-hidden className="mt-1 flex justify-between text-[10px] font-medium text-td-ink-2">
        {HOUR_LABELS.map((h) => (
          <span key={h} className="td-num">
            {h}:00
          </span>
        ))}
      </div>
    </section>
  );
}

// ---------- Калории ----------

export function CaloriesTile({ day, targets }: { day: MealDay | undefined; targets: Macros | null }) {
  const s = caloriesSummary(day, targets);
  const totals = day?.totals ?? { calories: 0, protein: 0, fat: 0, carbs: 0 };
  const goal = (v: number | undefined) => (v === undefined ? null : Math.round(v));
  return (
    <section className={cn(TILE, "flex flex-col px-[14px] pt-[13px] pb-[14px]")}>
      <h2 className={TILE_TITLE}>Калории</h2>
      <div className="mt-2 flex flex-1 items-center justify-between gap-3">
        <CalorieRing percent={s.percent} remaining={s.remaining} />
        <div className="flex min-w-0 flex-1 flex-col items-end gap-4">
          <MacroBar label="Белки" value={totals.protein} target={goal(targets?.protein)} gradient={MACRO_GRADIENT.protein} />
          <MacroBar label="Жиры" value={totals.fat} target={goal(targets?.fat)} gradient={MACRO_GRADIENT.fat} />
          <MacroBar label="Углеводы" value={totals.carbs} target={goal(targets?.carbs)} gradient={MACRO_GRADIENT.carbs} />
        </div>
      </div>
      <p className="td-num pt-2 text-xs text-td-ink-2">
        Съедено сегодня: {formatNumberRu(s.eaten)}
        {s.target !== null ? ` из ${formatNumberRu(s.target)}` : ""} ккал
      </p>
    </section>
  );
}

// ---------- Глюкоза ----------

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
      className="flex min-w-0 flex-1 flex-col gap-3 rounded-[24px] p-[14px] text-[#F3F5F9]"
      style={{
        background: tone === "low" ? "var(--td-glucose-low)" : "var(--td-glucose-high)",
        boxShadow: tone === "low" ? "var(--td-glucose-low-glow)" : "var(--td-glucose-high-glow)",
      }}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold">{label}</p>
        <Icon size={16} strokeWidth={1.66667} className="text-[#F3F5F9]" aria-hidden />
      </div>
      <p className="flex items-end gap-1">
        <span className="td-num text-xl font-medium">{value}</span>
        <span className="td-num text-xs text-[rgba(243,245,249,0.45)]">{unitText}</span>
      </p>
    </div>
  );
}

function GlucoseMarker() {
  return (
    <svg width={8} height={40} viewBox="0 0 8 40" fill="none" className="shrink-0" aria-hidden>
      <path d="M4 8L0.535899 2L7.4641 2L4 8Z" fill="#C9F14C" />
      <rect x={3} y={10} width={2} height={30} rx={1} fill="#C9F14C" />
    </svg>
  );
}

// Колонка «Глюкоза»: плитка 216px с текущим значением и под ней пара Низкий/Высокий.
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
  const slot = glucoseMarkerSlot(last ? last.mmol : null);
  // 14 штрихов; маркер стоит между ними в позиции slot (0..14).
  const row: ("tick" | "marker")[] = Array.from({ length: GLUCOSE_TICKS }, () => "tick");
  row.splice(slot, 0, "marker");
  return (
    <div className="flex flex-col gap-3">
      {/* Белый текст на этом градиенте: контраст ниже AA, решение пользователя (макет Figma). */}
      <section
        className="relative h-[216px] overflow-hidden rounded-[36px] text-white"
        style={{
          background: "radial-gradient(circle at 50% 19%, rgb(201,165,175), rgb(201,211,216) 75%)",
          boxShadow: "inset 0 0 70px #C6D0D7",
        }}
      >
        <h2 className="absolute top-4 left-6 text-base font-semibold">Глюкоза</h2>
        <div className="absolute top-[68px] right-0 left-0 flex flex-col items-center">
          <p className="td-num text-[60px] leading-[60px] font-normal">{last ? show(last.mmol) : "—"}</p>
          {last ? <p className="text-xs text-[rgba(255,255,255,0.65)]">{unitText}</p> : null}
        </div>
        <div aria-hidden className="absolute top-[153px] right-0 left-0 flex items-start justify-center gap-[6px]">
          {row.map((kind, i) =>
            kind === "marker" ? (
              <GlucoseMarker key={i} />
            ) : (
              <span key={i} className="mt-[10px] h-5 w-[2px] shrink-0 rounded-[4px] bg-white" />
            ),
          )}
        </div>
      </section>
      <div className="flex gap-3">
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
