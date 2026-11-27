import { initialsOf } from "@/lib/patientListView";
import { cn } from "@/lib/utils";

// Аватар только из инициалов на лайме: фото пациента врачу не показываются (D-04).
export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-14 shrink-0 items-center justify-center rounded-full bg-td-accent text-lg font-semibold text-td-ink",
        className,
      )}
    >
      {initialsOf(name)}
    </span>
  );
}
