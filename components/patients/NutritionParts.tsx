import { barPercent } from "@/lib/patientSummaryView";
import { formatNumberRu } from "@/lib/mealFeedView";
import { cn } from "@/lib/utils";

// Общие элементы питания для карточки списка и сводки: кольцо «Осталось» и полосы Б/Ж/У.

export const MACRO_GRADIENT = {
  protein: "var(--td-protein)",
  fat: "var(--td-fat)",
  carbs: "var(--td-carbs)",
} as const;

// Кольцо с оранжевой дугой прогресса. remaining null: цели нет, в центре «—».
export function CalorieRing({
  size,
  stroke,
  percent,
  remaining,
  numClass,
  labelClass,
}: {
  size: number;
  stroke: number;
  percent: number;
  remaining: number | null;
  numClass: string;
  labelClass: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(100, Math.max(0, percent)) / 100);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="size-full -rotate-90" aria-hidden>
        <defs>
          <linearGradient id="td-ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F7B885" />
            <stop offset="100%" stopColor="#F1853C" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="white" strokeWidth={stroke} />
        {percent > 0 ? (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="url(#td-ring-grad)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
          />
        ) : null}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("td-num leading-none font-medium", numClass)}>
          {remaining === null ? "—" : formatNumberRu(remaining)}
        </span>
        <span className={cn("mt-0.5 text-td-ink-2", labelClass)}>
          {remaining !== null && remaining < 0 ? "Перебор" : "Осталось"}
        </span>
      </div>
    </div>
  );
}

// Полоса нутриента: значение и «/цель», трек белый 9px, заливка 5px с градиентом из токенов.
export function MacroBar({
  label,
  value,
  target,
  gradient,
  large = false,
}: {
  label: string;
  value: number;
  target: number | null;
  gradient: string;
  large?: boolean;
}) {
  const pct = barPercent(value, target);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold">{label}</span>
        <span className="td-num whitespace-nowrap">
          <span className={cn("font-medium", large ? "text-xl" : "text-sm")}>{formatNumberRu(value)}</span>
          {target !== null ? <span className="text-xs text-td-ink-3">/{formatNumberRu(target)}</span> : null}
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
        {pct > 0 ? (
          <div className="h-[5px] rounded-full" style={{ width: `${pct}%`, background: gradient }} />
        ) : null}
      </div>
    </div>
  );
}
