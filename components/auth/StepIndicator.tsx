import { cn } from "@/lib/utils";

const TOTAL = 4;

// «Шаг N из 4»; заполненный шаг — лайм.
export function StepIndicator({ step }: { step: 1 | 2 | 3 | 4 }) {
  return (
    <div className="flex flex-col gap-2" role="group" aria-label={`Шаг ${step} из ${TOTAL}`}>
      <p className="text-sm leading-normal font-semibold text-[#5B6270]">
        Шаг {step} из {TOTAL}
      </p>
      <div className="flex gap-2" aria-hidden>
        {Array.from({ length: TOTAL }, (_, i) => (
          <span
            key={i}
            className={cn("h-1 flex-1 rounded-full", i < step ? "bg-[#C9F14C]" : "bg-[#E5E7EB]")}
          />
        ))}
      </div>
    </div>
  );
}
