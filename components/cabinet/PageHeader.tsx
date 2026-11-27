import type { ReactNode } from "react";
import { ExpandButton } from "@/components/cabinet/ExpandButton";
import { WeekBar } from "@/components/cabinet/WeekBar";

// Шапка страницы по макету: заголовок слева, кнопки и панель недели справа, одна строка.
// leading: небольшой элемент над заголовком (например, ссылка «назад»).
export function PageHeader({
  title,
  expand = false,
  leading,
}: {
  title: string;
  expand?: boolean;
  leading?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
      <div className="flex min-w-0 flex-col items-start gap-3">
        {leading}
        <h1 className="text-[40px] leading-[1.1] font-semibold tracking-[-0.6px] text-td-ink max-sm:text-[32px]">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-3">
        {expand ? <ExpandButton /> : null}
        <WeekBar />
      </div>
    </div>
  );
}
