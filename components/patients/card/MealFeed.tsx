"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { MealDay } from "@/lib/convexApi";
import { caloriesProgress, dayHeading, formatMacros, formatNumberRu } from "@/lib/mealFeedView";
import { mealTypeLabel } from "@/lib/patientLabels";

export type MealFeedProps = {
  days: MealDay[];
  targets: { calories: number; protein: number; fat: number; carbs: number } | null;
  hasMore: boolean;
  todayKey: string;
  yesterdayKey: string;
  onShowMore: () => void;
  loadingMore: boolean;
};

const timeFormat = new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" });

export function MealFeed({
  days,
  targets,
  hasMore,
  todayKey,
  yesterdayKey,
  onShowMore,
  loadingMore,
}: MealFeedProps) {
  return (
    <section className="rounded-[36px] bg-td-tile p-6 text-td-ink lg:col-span-2">
      <h2 className="text-base font-semibold">Питание</h2>

      {days.length === 0 ? (
        <p className="mt-4 text-base leading-normal font-normal text-td-ink-2">
          За последние 7 дней приёмов пищи нет
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-6">
          {days.map((day) => {
            const progress = caloriesProgress(day.totals.calories, targets?.calories ?? null);
            return (
              <div key={day.date}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-sm leading-[1.4] font-semibold">
                    {dayHeading(day.date, todayKey, yesterdayKey)}
                  </h3>
                  <p className="text-sm leading-[1.4] font-normal tabular-nums">
                    {targets
                      ? `${formatNumberRu(day.totals.calories)} из ${formatNumberRu(targets.calories)} ккал`
                      : `${formatNumberRu(day.totals.calories)} ккал`}
                  </p>
                </div>
                {targets ? (
                  <div className="mt-2 flex items-center gap-3">
                    <Progress
                      value={progress.percent}
                      aria-label="Калории за день"
                      className="h-2 bg-white [&>*]:bg-[#0A0D12]"
                    />
                    {progress.overText ? (
                      <span className="text-sm leading-[1.4] font-semibold whitespace-nowrap tabular-nums">
                        {progress.overText}
                      </span>
                    ) : null}
                  </div>
                ) : null}
                <p className="mt-2 text-sm leading-[1.4] font-normal text-td-ink-2 tabular-nums">
                  {formatMacros(day.totals)}
                  {targets
                    ? ` из ${Math.round(targets.protein)} · ${Math.round(targets.fat)} · ${Math.round(targets.carbs)}`
                    : null}
                </p>
                <ul className="mt-3 flex flex-col divide-y divide-black/10">
                  {day.meals.map((meal) => (
                    <li
                      key={meal.mealId}
                      className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-2"
                    >
                      <span className="w-12 text-sm leading-[1.4] font-normal tabular-nums">
                        {timeFormat.format(new Date(meal.eatenAt))}
                      </span>
                      <span className="w-20 text-sm leading-[1.4] font-semibold">
                        {mealTypeLabel(meal.mealType)}
                      </span>
                      <span className="min-w-0 flex-1 text-base leading-normal font-normal">
                        {meal.name ?? "Блюдо"}
                      </span>
                      {meal.grams !== null ? (
                        <span className="text-sm leading-[1.4] font-normal tabular-nums">
                          {formatNumberRu(meal.grams)} г
                        </span>
                      ) : null}
                      <span className="text-sm leading-[1.4] font-normal tabular-nums">
                        {formatNumberRu(meal.calories)} ккал · {formatMacros(meal)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      {hasMore ? (
        <Button
          type="button"
          variant="outline"
          disabled={loadingMore}
          onClick={onShowMore}
          className="mt-4 h-11 rounded-full px-5 font-semibold"
        >
          {loadingMore ? <Loader2 className="animate-spin" aria-hidden /> : null}
          Показать ещё 7 дней
        </Button>
      ) : null}
    </section>
  );
}
