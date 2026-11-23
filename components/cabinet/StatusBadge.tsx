import type { DoctorStatus } from "@/lib/convexApi";
import { doctorStatusLabel } from "@/lib/labels";
import { cn } from "@/lib/utils";

const STYLES: Record<DoctorStatus, string> = {
  pending: "bg-[var(--status-pending-bg)] text-[var(--status-pending-fg)]",
  verified: "bg-[var(--status-verified-bg)] text-[var(--status-verified-fg)]",
  rejected: "bg-[var(--status-rejected-bg)] text-[var(--status-rejected-fg)]",
};

export function StatusBadge({ status, className }: { status: DoctorStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-sm leading-[1.4] font-semibold",
        STYLES[status],
        className,
      )}
    >
      {doctorStatusLabel(status)}
    </span>
  );
}
