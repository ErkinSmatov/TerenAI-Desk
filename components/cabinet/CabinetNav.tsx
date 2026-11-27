"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/", label: "Главная" },
  { href: "/patients", label: "Пациенты" },
] as const;

// Пилюля как в макете (1494:1034): #E9E9E9, только текст, отступ слева 25px, без иконок.
// Активный пункт залит белым #FFFFFF; лаймовой остаётся только «Подключить пациента».
const PILL =
  "flex h-16 shrink-0 items-center justify-between rounded-[40px] pr-[13px] pl-[25px] text-base font-semibold text-td-ink transition-colors outline-none focus-visible:ring-2 focus-visible:ring-td-ink focus-visible:ring-offset-2 max-lg:h-11 max-lg:pl-4";

// Навигация кабинета verified-врача. Для "/" активен только точный путь.
// pendingCount: число подключений, ожидающих подтверждения; 0 скрывает бейдж.
export function CabinetNav({ pendingCount = 0 }: { pendingCount?: number }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Разделы кабинета" className="flex gap-1 max-lg:flex-wrap lg:flex-col">
      {ITEMS.map(({ href, label }) => {
        const active =
          href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
        const showBadge = href === "/patients" && pendingCount > 0;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(PILL, active ? "bg-white" : "bg-td-pill hover:bg-td-badge")}
          >
            {label}
            {showBadge ? (
              <span
                className="flex h-[38px] min-w-[53px] items-center justify-center rounded-[40px] bg-td-badge px-3 text-xs font-normal text-td-ink-2"
                aria-label={`Ожидают подтверждения: ${pendingCount}`}
              >
                {pendingCount}
              </span>
            ) : null}
          </Link>
        );
      })}
      {/* Раздела настроек пока нет: пункт выглядит как остальные, но без перехода. */}
      <span aria-disabled="true" title="Скоро" className={cn(PILL, "cursor-default bg-td-pill")}>
        Настройки
      </span>
    </nav>
  );
}
