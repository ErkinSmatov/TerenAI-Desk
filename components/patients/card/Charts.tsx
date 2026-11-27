"use client";

import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatDayMonth, formatDayMonthTime, summarize, xTicks } from "@/lib/chartSummary";
import type { BpPoint, GlucosePoint, Level } from "@/lib/convexApi";
import { formatGlucose } from "@/lib/patientLabels";
import { ChartTile } from "./ChartTile";

const INK = "#0A0D12";
const MUTED = "#5B6270";
const GRID = "#E5E7EB";
const ZONE = "#DCFCE7";
const WARNING = "#92400E";
const CRITICAL = "#B42318";

type ZoneRange = { min: number; max: number };

const nf1 = new Intl.NumberFormat("ru-RU", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const nf0 = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 });

function localOffset(ms: number): number {
  return -new Date(ms).getTimezoneOffset();
}
function dayMonth(ms: number): string {
  return formatDayMonth(ms, localOffset(ms));
}
function dayMonthTime(ms: number): string {
  return formatDayMonthTime(ms, localOffset(ms));
}

function emptyConfig(): ChartConfig {
  return {};
}

function BigValue({ children }: { children: ReactNode }) {
  return (
    <p className="text-[28px] leading-[1.2] font-semibold tabular-nums" aria-hidden="true">
      {children}
    </p>
  );
}

function NormLegend() {
  return (
    <p className="flex items-center gap-2 text-sm leading-normal font-normal text-[#5B6270]">
      <span
        aria-hidden="true"
        className="inline-block h-3 w-5 rounded-sm"
        style={{ backgroundColor: ZONE, opacity: 0.6 }}
      />
      Норма
    </p>
  );
}

type DotProps = { cx?: number; cy?: number; payload?: { status?: Level } };

// Форма точки по статусу с сервера: ок — маленький кружок, внимание — кружок, критично — ромб.
function statusDot(props: DotProps) {
  const { cx, cy, payload } = props;
  if (cx === undefined || cy === undefined) return <g />;
  const status = payload?.status ?? "ok";
  if (status === "critical") {
    const r = 6;
    return (
      <polygon
        points={`${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`}
        fill={CRITICAL}
      />
    );
  }
  if (status === "warning") return <circle cx={cx} cy={cy} r={5} fill={WARNING} />;
  return <circle cx={cx} cy={cy} r={4} fill={INK} />;
}

const STATUS_WORD: Record<Level, string> = { ok: "норма", warning: "внимание", critical: "критично" };

function timeAxis(ts: number[]) {
  return {
    type: "number" as const,
    dataKey: "t",
    domain: ["dataMin", "dataMax"] as [string, string],
    ticks: xTicks(ts),
    tickFormatter: (v: number) => dayMonth(v),
    tickLine: false,
    axisLine: false,
    tickMargin: 8,
    stroke: MUTED,
  };
}

function tooltipLabel(_: unknown, payload: ReadonlyArray<{ payload?: { t?: number } }>) {
  const t = payload?.[0]?.payload?.t;
  return typeof t === "number" ? dayMonthTime(t) : "";
}

// ---------- Глюкоза ----------

export function GlucoseChart({
  points,
  range,
  unit,
  onUnitChange,
}: {
  points: GlucosePoint[];
  range: { mmol: ZoneRange; mgdl: ZoneRange };
  unit: "mmol" | "mgdl";
  onUnitChange: (u: "mmol" | "mgdl") => void;
}) {
  const key = unit === "mmol" ? "mmol" : "mgdl";
  const data = points.map((p) => ({ ...p, v: p[key] }));
  const zone = unit === "mmol" ? range.mmol : range.mgdl;
  const values = data.map((d) => d.v);
  const lastPoint = points.length > 0 ? points[points.length - 1] : null;
  const s = summarize(values, lastPoint ? lastPoint[key] : null);
  const unitText = unit === "mmol" ? "ммоль/л" : "мг/дл";
  const fmt = (v: number) => (unit === "mmol" ? nf1.format(v) : nf0.format(v));

  const summaryLabel =
    s.last === null
      ? "Глюкоза: нет измерений"
      : `Глюкоза за период: минимум ${fmt(s.min ?? s.last)}, максимум ${fmt(s.max ?? s.last)}, последнее ${fmt(s.last)} ${unitText}`;

  return (
    <ChartTile
      title="Глюкоза"
      unitLabel={unitText}
      summaryLabel={summaryLabel}
      isEmpty={points.length === 0}
      fullWidth
      table={{
        header: ["Дата и время", `Глюкоза, ${unitText}`, "Статус"],
        rows: data.map((d) => [dayMonthTime(d.t), fmt(d.v), STATUS_WORD[d.status]]),
      }}
      headerExtra={
        <div className="flex flex-col items-end gap-2">
          {lastPoint ? <BigValue>{formatGlucose(lastPoint.mmol, lastPoint.mgdl, unit)}</BigValue> : null}
          <ToggleGroup
            type="single"
            value={unit}
            onValueChange={(v) => {
              if (v === "mmol" || v === "mgdl") onUnitChange(v);
            }}
            aria-label="Единицы глюкозы"
          >
            <ToggleGroupItem value="mmol" aria-pressed={unit === "mmol"} className="min-h-11 text-sm font-semibold">
              ммоль/л
            </ToggleGroupItem>
            <ToggleGroupItem value="mgdl" aria-pressed={unit === "mgdl"} className="min-h-11 text-sm font-semibold">
              мг/дл
            </ToggleGroupItem>
          </ToggleGroup>
          <NormLegend />
        </div>
      }
    >
      <ChartContainer config={emptyConfig()} className="aspect-auto h-full w-full">
        <LineChart accessibilityLayer data={data} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis {...timeAxis(data.map((d) => d.t))} />
          <YAxis
            width={40}
            tickLine={false}
            axisLine={false}
            stroke={MUTED}
            domain={["auto", "auto"]}
            tickFormatter={(v: number) => fmt(v)}
          />
          <ReferenceArea y1={zone.min} y2={zone.max} fill={ZONE} fillOpacity={0.6} ifOverflow="extendDomain" />
          <ChartTooltip
            content={
              <ChartTooltipContent
                hideIndicator
                labelFormatter={tooltipLabel}
                formatter={(value) => <span className="tabular-nums">{`${fmt(Number(value))} ${unitText}`}</span>}
              />
            }
          />
          <Line
            dataKey="v"
            name="Глюкоза"
            type="monotone"
            stroke={INK}
            strokeWidth={2}
            dot={statusDot}
            activeDot={statusDot}
            isAnimationActive={false}
          />
        </LineChart>
      </ChartContainer>
    </ChartTile>
  );
}

// ---------- Давление ----------

export function BloodPressureChart({
  points,
  ranges,
}: {
  points: BpPoint[];
  ranges: { systolic: ZoneRange; diastolic: ZoneRange };
}) {
  const last = points.length > 0 ? points[points.length - 1] : null;
  const sys = summarize(points.map((p) => p.systolic), last?.systolic ?? null);
  const dia = summarize(points.map((p) => p.diastolic), last?.diastolic ?? null);

  const summaryLabel =
    last === null
      ? "Давление: нет измерений"
      : `Давление за период: систолическое от ${sys.min} до ${sys.max}, диастолическое от ${dia.min} до ${dia.max}, последнее ${last.systolic}/${last.diastolic} мм рт. ст.`;

  return (
    <ChartTile
      title="Давление"
      unitLabel="мм рт. ст."
      summaryLabel={summaryLabel}
      isEmpty={points.length === 0}
      fullWidth
      table={{
        header: ["Дата и время", "Систолическое", "Диастолическое", "Статус"],
        rows: points.map((p) => [dayMonthTime(p.t), String(p.systolic), String(p.diastolic), STATUS_WORD[p.status]]),
      }}
      headerExtra={
        <div className="flex flex-col items-end gap-2">
          {last ? <BigValue>{`${last.systolic}/${last.diastolic} мм рт. ст.`}</BigValue> : null}
          <NormLegend />
        </div>
      }
    >
      <ChartContainer config={emptyConfig()} className="aspect-auto h-full w-full">
        <LineChart accessibilityLayer data={points} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis {...timeAxis(points.map((p) => p.t))} />
          <YAxis width={40} tickLine={false} axisLine={false} stroke={MUTED} domain={["auto", "auto"]} />
          <ReferenceArea
            y1={ranges.systolic.min}
            y2={ranges.systolic.max}
            fill={ZONE}
            fillOpacity={0.6}
            ifOverflow="extendDomain"
          />
          <ReferenceArea
            y1={ranges.diastolic.min}
            y2={ranges.diastolic.max}
            fill={ZONE}
            fillOpacity={0.6}
            ifOverflow="extendDomain"
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={tooltipLabel}
                formatter={(value, name) => (
                  <span className="tabular-nums">{`${String(name)}: ${String(value)}`}</span>
                )}
              />
            }
          />
          <Line
            dataKey="systolic"
            name="Систолическое"
            type="monotone"
            stroke={INK}
            strokeWidth={2}
            dot={statusDot}
            activeDot={statusDot}
            isAnimationActive={false}
          />
          <Line
            dataKey="diastolic"
            name="Диастолическое"
            type="monotone"
            stroke={MUTED}
            strokeWidth={2}
            strokeDasharray="6 3"
            dot={statusDot}
            activeDot={statusDot}
            isAnimationActive={false}
          />
        </LineChart>
      </ChartContainer>
    </ChartTile>
  );
}

// ---------- Вес ----------

export function WeightChart({ points }: { points: { t: number; kg: number }[] }) {
  const last = points.length > 0 ? points[points.length - 1] : null;
  const s = summarize(points.map((p) => p.kg), last?.kg ?? null);
  const summaryLabel =
    s.last === null
      ? "Вес: нет измерений"
      : `Вес за период: минимум ${nf1.format(s.min ?? s.last)}, максимум ${nf1.format(s.max ?? s.last)}, последнее ${nf1.format(s.last)} кг`;

  return (
    <ChartTile
      title="Вес"
      unitLabel="кг"
      summaryLabel={summaryLabel}
      isEmpty={points.length === 0}
      table={{
        header: ["Дата и время", "Вес, кг"],
        rows: points.map((p) => [dayMonthTime(p.t), nf1.format(p.kg)]),
      }}
      headerExtra={last ? <BigValue>{`${nf1.format(last.kg)} кг`}</BigValue> : null}
    >
      <ChartContainer config={emptyConfig()} className="aspect-auto h-full w-full">
        <LineChart accessibilityLayer data={points} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis {...timeAxis(points.map((p) => p.t))} />
          <YAxis width={40} tickLine={false} axisLine={false} stroke={MUTED} domain={["auto", "auto"]} />
          <ChartTooltip
            content={
              <ChartTooltipContent
                hideIndicator
                labelFormatter={tooltipLabel}
                formatter={(value) => <span className="tabular-nums">{`${nf1.format(Number(value))} кг`}</span>}
              />
            }
          />
          <Line
            dataKey="kg"
            name="Вес"
            type="monotone"
            stroke={INK}
            strokeWidth={2}
            dot={{ r: 4, fill: INK }}
            isAnimationActive={false}
          />
        </LineChart>
      </ChartContainer>
    </ChartTile>
  );
}

// ---------- Шаги ----------

function dateToMs(date: string): number {
  return Date.parse(`${date}T00:00:00Z`);
}

export function StepsChart({ points, goal }: { points: { date: string; steps: number }[]; goal: number }) {
  const last = points.length > 0 ? points[points.length - 1] : null;
  const s = summarize(points.map((p) => p.steps), last?.steps ?? null);
  const goalText = nf0.format(goal);
  const summaryLabel =
    s.last === null
      ? "Шаги: нет измерений"
      : `Шаги за период: минимум ${nf0.format(s.min ?? s.last)}, максимум ${nf0.format(s.max ?? s.last)}, последнее ${nf0.format(s.last)}, цель ${goalText} в день`;

  const idx = xTicks(points.map((_, i) => i));
  const ticks = idx.map((i) => points[i].date);

  return (
    <ChartTile
      title="Шаги"
      unitLabel="шагов в день"
      summaryLabel={summaryLabel}
      isEmpty={points.length === 0}
      table={{
        header: ["Дата", "Шаги"],
        rows: points.map((p) => [formatDayMonth(dateToMs(p.date)), nf0.format(p.steps)]),
      }}
      headerExtra={last ? <BigValue>{`${nf0.format(last.steps)}`}</BigValue> : null}
    >
      <ChartContainer config={emptyConfig()} className="aspect-auto h-full w-full">
        <BarChart accessibilityLayer data={points} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis
            dataKey="date"
            ticks={ticks}
            tickFormatter={(v: string) => formatDayMonth(dateToMs(v))}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            stroke={MUTED}
          />
          <YAxis width={44} tickLine={false} axisLine={false} stroke={MUTED} domain={[0, "auto"]} />
          <ChartTooltip
            content={
              <ChartTooltipContent
                hideIndicator
                labelFormatter={(_, payload) => {
                  const d = payload?.[0]?.payload?.date;
                  return typeof d === "string" ? formatDayMonth(dateToMs(d)) : "";
                }}
                formatter={(value) => <span className="tabular-nums">{`${nf0.format(Number(value))} шагов`}</span>}
              />
            }
          />
          <ReferenceLine
            y={goal}
            stroke={MUTED}
            strokeDasharray="6 4"
            ifOverflow="extendDomain"
            label={{ value: `Цель ${goalText}`, position: "insideTopRight", fill: MUTED, fontSize: 14 }}
          />
          <Bar dataKey="steps" name="Шаги" fill={INK} isAnimationActive={false} />
        </BarChart>
      </ChartContainer>
    </ChartTile>
  );
}
