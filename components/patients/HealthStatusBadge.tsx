import { CircleCheck, CircleOff, OctagonAlert, TriangleAlert, type LucideIcon } from "lucide-react";
import type { HealthStatus } from "@/lib/convexApi";
import { statusLabel } from "@/lib/patientLabels";

// Светофор состояния (UI-SPEC): иконка + текст + цвет, цвет не единственный носитель смысла.
const STATUS_CLASS: Record<HealthStatus, string> = {
  ok: "bg-[#DCFCE7] text-[#166534]",
  warning: "bg-[#FEF3C7] text-[#92400E]",
  critical: "bg-[#FEE2E2] text-[#B42318]",
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
}: {
  status: HealthStatus;
  noDataDays?: number;
}) {
  const Icon = STATUS_ICON[status];
  return (
    <span
      className={`inline-flex h-7 items-center gap-1 rounded-full px-3 text-sm font-semibold ${STATUS_CLASS[status]}`}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      {statusLabel(status, noDataDays)}
    </span>
  );
}
