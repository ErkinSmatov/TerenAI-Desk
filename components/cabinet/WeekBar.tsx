"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

const DAY_NAMES = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

function weekDays(today: Date): { key: string; label: string; num: number }[] {
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    return { key: d.toDateString(), label: DAY_NAMES[d.getDay()], num: d.getDate() };
  });
}

// Календарь и панель недели по макету. Визуальный переключатель: данные не меняет (контракт без выбора даты).
export function WeekBar() {
  const [selected, setSelected] = useState(() => new Date().toDateString());
  const [days] = useState(() => weekDays(new Date()));
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        aria-label="Календарь"
        className="flex size-[46px] items-center justify-center rounded-full bg-td-pill text-td-ink outline-none focus-visible:ring-2 focus-visible:ring-td-ink"
      >
        <CalendarDays className="size-5" aria-hidden />
      </button>
      <div role="group" aria-label="Дни недели" className="flex gap-1 rounded-[28px] bg-td-pill p-1">
        {days.map((d) => {
          const active = d.key === selected;
          return (
            <button
              key={d.key}
              type="button"
              aria-pressed={active}
              onClick={() => setSelected(d.key)}
              className={cn(
                "flex h-[46px] w-[55px] flex-col items-center justify-center rounded-[24px] text-xs leading-tight outline-none focus-visible:ring-2 focus-visible:ring-td-ink max-sm:w-9",
                active ? "bg-td-accent font-semibold" : "hover:bg-td-badge",
              )}
            >
              <span className="text-td-ink-2 max-sm:hidden">{d.label}</span>
              <span className="td-num text-sm font-semibold">{d.num}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
