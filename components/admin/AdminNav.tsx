"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin/requests", label: "Заявки" },
  { href: "/admin/doctors", label: "Врачи" },
  { href: "/admin/clinics", label: "Клиники" },
] as const;

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Разделы администрирования" className="flex gap-2 md:flex-col">
      {ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-11 items-center rounded-full px-5 text-sm font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#0A0D12] focus-visible:ring-offset-2",
              active ? "bg-[#C9F14C] text-[#0A0D12]" : "text-[#0A0D12] hover:bg-[#F4F5F7]",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
