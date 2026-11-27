import type { PatientStatus } from "@/lib/convexApi";
import { reasonText } from "@/lib/patientLabels";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function formatLastRecord(ms: number, now: Date): string {
  const d = new Date(ms);
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) return `сегодня ${time}`;
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)} ${time}`;
}

// Содержимое блока «Состояние» внутри плитки пациента: причина статуса и время последней записи.
export function StateTile({
  status,
  approximate,
  compact = false,
}: {
  status: PatientStatus;
  approximate: boolean;
  compact?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className={compact ? "text-xs leading-snug" : "text-sm leading-normal font-normal"}>
        {reasonText(status.reason)}
      </p>
      <p
        className={`${compact ? "text-xs" : "text-sm"} leading-normal font-normal text-td-ink-2 tabular-nums`}
        suppressHydrationWarning
      >
        Последняя запись:{" "}
        {status.lastRecordAt === null ? "нет записей" : formatLastRecord(status.lastRecordAt, new Date())}
      </p>
      {approximate ? (
        <p className="text-xs leading-normal font-normal text-td-ink-3">Оценка по дневным данным</p>
      ) : null}
    </div>
  );
}
