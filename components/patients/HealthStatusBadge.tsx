import { CircleCheck, CircleOff, OctagonAlert, TriangleAlert, type LucideIcon } from "lucide-react";
import type { HealthStatus } from "@/lib/convexApi";
import { statusLabel } from "@/lib/patientLabels";

// Светофор состояния (UI-SPEC): иконка + текст + цвет, цвет не единственный носитель смысла.
const STATUS_CLASS: Record<HealthStatus, string> = {
  ok: "bg-[#DCFCE7] text-[#166534]",
  warning: "bg-[#FEF3C7] text-[#92400E]",
  critical: "bg-[#FEE2E2] text-[#B42318] shadow-[inset_0_0_12px_rgba(228,0,5,0.25)]",
  no_data: "bg-[#F4F5F7] text-[#5B6270]",
};

const STATUS_ICON: Record<HealthStatus, LucideIcon> = {
  ok: CircleCheck,
  warning: TriangleAlert,
  critical: OctagonAlert,
  no_data: CircleOff,
};

export function HealthStatusBadge({
  status,
  noDataDays,
  compact = false,
}: {
  status: HealthStatus;
  noDataDays?: number;
  compact?: boolean;
}) {
  const Icon = STATUS_ICON[status];
  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold ${
        compact ? "h-6 rounded-[12px] px-2.5 text-xs" : "h-7 rounded-full px-3 text-sm"
      } ${STATUS_CLASS[status]}`}
    >
      <Icon className={compact ? "size-3.5 shrink-0" : "size-4 shrink-0"} aria-hidden />
      {statusLabel(status, noDataDays)}
    </span>
  );
}
