"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Settings, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/", label: "Главная", Icon: Home },
  { href: "/patients", label: "Пациенты", Icon: Users },
] as const;

const PILL =
  "flex h-16 shrink-0 items-center gap-3 rounded-[40px] px-6 text-sm font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-td-ink focus-visible:ring-offset-2 max-lg:h-11 max-lg:px-4";

// Навигация кабинета verified-врача (пилюли сайдбара). Для "/" активен только точный путь.
export function CabinetNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Разделы кабинета" className="flex gap-2 max-lg:flex-wrap lg:flex-col">
      {ITEMS.map(({ href, label, Icon }) => {
        const active =
          href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              PILL,
              active ? "bg-td-accent text-td-ink" : "bg-td-pill text-td-ink hover:bg-td-badge",
            )}
          >
            <Icon className="size-5" aria-hidden />
            {label}
          </Link>
        );
      })}
      {/* Раздела настроек пока нет: пункт показан по макету, но неактивен. */}
      <span
        aria-disabled="true"
        title="Скоро"
        className={cn(PILL, "cursor-not-allowed bg-td-pill text-td-ink-3")}
      >
        <Settings className="size-5" aria-hidden />
        Настройки
      </span>
    </nav>
  );
}
