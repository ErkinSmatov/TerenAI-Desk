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

export function StateTile({ status, approximate }: { status: PatientStatus; approximate: boolean }) {
  return (
    <section className="rounded-[32px] bg-[#F7F7F7] p-6 text-[#0A0D12] shadow-sm">
      <h2 className="text-xl leading-[1.2] font-semibold">Состояние</h2>
      <p className="mt-4 text-base leading-normal font-normal">{reasonText(status.reason)}</p>
      <p className="mt-2 text-base leading-normal font-normal tabular-nums" suppressHydrationWarning>
        Последняя запись:{" "}
        {status.lastRecordAt === null ? "нет записей" : formatLastRecord(status.lastRecordAt, new Date())}
      </p>
      {approximate ? (
        <p className="mt-2 text-sm leading-normal font-normal text-[#5B6270]">
          Оценка по дневным данным
        </p>
      ) : null}
    </section>
  );
}
