import { useId } from "react";
import { SportShoe } from "lucide-react";
import { barPercent, RING, ringArc } from "@/lib/patientSummaryView";
import { formatNumberRu } from "@/lib/mealFeedView";

// Общие элементы питания и шагов для карточки списка и сводки (Figma 1483:869, 1494:5250).

export const MACRO_GRADIENT = {
  protein: "var(--td-protein)",
  fat: "var(--td-fat)",
  carbs: "var(--td-carbs)",
} as const;

// Внешний белый «пончик» из calories-ring.svg (радиус 70.5, толщина 9).
const RING_DONUT =
  "M70.5 0C109.436 0 141 31.5639 141 70.5C141 109.436 109.436 141 70.5 141C31.5639 141 0 109.436 0 70.5C0 31.5639 31.5639 0 70.5 0ZM70.5 9C36.5345 9 9 36.5345 9 70.5C9 104.466 36.5345 132 70.5 132C104.466 132 132 104.466 132 70.5C132 36.5345 104.466 9 70.5 9Z";

// Динамическое кольцо 141x144: дуга r=66.5 от 12 часов по часовой, точка на конце.
// Градиент #EE6A22 -> #FEE8D9 линейный вдоль хорды дуги (conic в SVG без foreignObject недоступен).
// remaining null: цели нет, в центре «—».
export function CalorieRing({ percent, remaining }: { percent: number; remaining: number | null }) {
  const gradId = useId();
  const arc = ringArc(percent);
  const start = { x: RING.cx, y: RING.cy - RING.arcR };
  const gradEnd = arc.fraction > 0.5 || arc.fraction === 0 ? { x: RING.cx, y: RING.cy + RING.arcR } : arc.end;
  return (
    <div className="relative h-[144px] w-[141px] shrink-0">
      <svg width={141} height={144} viewBox="0 0 141 144" fill="none" className="absolute inset-0 overflow-visible" aria-hidden>
        <defs>
          <linearGradient
            id={gradId}
            gradientUnits="userSpaceOnUse"
            x1={start.x}
            y1={start.y}
            x2={gradEnd.x}
            y2={gradEnd.y}
          >
            <stop offset="0" stopColor="#EE6A22" />
            <stop offset="1" stopColor="#FEE8D9" />
          </linearGradient>
        </defs>
        <path d={RING_DONUT} fill="white" />
        {arc.d ? (
          <path d={arc.d} stroke={`url(#${gradId})`} strokeWidth={5} strokeLinecap="round" />
        ) : null}
        <circle cx={arc.end.x} cy={arc.end.y} r={6} fill="#F19062" stroke="white" strokeWidth={2} />
      </svg>
      <div className="absolute top-[70.5px] left-0 flex w-full -translate-y-1/2 flex-col items-center">
        <span className="td-num text-[42px] leading-[42px] font-normal text-[#0C0D12]">
          {remaining === null ? "—" : formatNumberRu(remaining)}
        </span>
        <span className="text-xs text-[rgba(12,13,18,0.6)]">
          {remaining !== null && remaining < 0 ? "Перебор" : "Осталось"}
        </span>
      </div>
    </div>
  );
}

// Полоса: белый трек 9px (радиус 5), заливка 5px с отступом 2px. Ширина заливки = доля 0..100.
function Track({ pct, label, gradient, now }: { pct: number; label: string; gradient: string; now: number }) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={now}
      className="relative flex h-[9px] w-full items-center rounded-[5px] bg-white px-[2px]"
    >
      {pct > 0 ? <div className="h-[5px] rounded-[5px]" style={{ width: `${pct}%`, background: gradient }} /> : null}
    </div>
  );
}

// Полоса нутриента: подпись, значение Outfit Medium 20 и «/цель» 12, под ними полоса.
export function MacroBar({
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
    <div className="w-full max-w-[157px]">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold text-[rgba(12,13,18,0.65)]">{label}</span>
        <span className="td-num whitespace-nowrap">
          <span className="text-xl font-medium text-[#0C0D12]">{formatNumberRu(value)}</span>
          {target !== null ? (
            <span className="text-xs font-medium text-[rgba(12,13,18,0.45)]">/{formatNumberRu(target)}</span>
          ) : null}
        </span>
      </div>
      <div className="mt-px">
        <Track pct={pct} label={label} gradient={gradient} now={Math.round(pct)} />
      </div>
    </div>
  );
}

const STEP_DOTS = [1.5, 20, 38.5, 57, 75.5, 94, 112.5, 131, 149.5];

// Блок шагов 157px: число шагов, кроссовок, цель; трек с заливкой по доле и девятью точками (steps-dots.svg).
export function StepsBlock({ steps, goal }: { steps: number; goal: number }) {
  const pct = barPercent(steps, goal);
  return (
    <div className="flex w-[157px] shrink-0 flex-col gap-1">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center">
        <span className="td-num text-xs font-medium">{formatNumberRu(steps)}</span>
        <SportShoe size={20} strokeWidth={1.66667} className="text-td-ink" aria-hidden />
        <span className="justify-self-end text-xs font-medium">{formatNumberRu(goal)}</span>
      </div>
      <div className="relative">
        <Track pct={pct} label="Шаги" gradient="var(--td-steps)" now={Math.round(pct)} />
        <svg
          width={151}
          height={3}
          viewBox="0 0 151 3"
          className="pointer-events-none absolute top-[3px] left-[3px]"
          aria-hidden
        >
          {STEP_DOTS.map((cx) => (
            <circle key={cx} cx={cx} cy={1.5} r={1.5} fill="#A7C646" />
          ))}
        </svg>
      </div>
    </div>
  );
}
