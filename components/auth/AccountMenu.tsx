"use client";

import type { ReactNode } from "react";
import { UserRound } from "lucide-react";
import { SignOutButton } from "@/components/auth/SignOutButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Меню аккаунта в шапках кабинета и /admin. Клиентский компонент: обработчик onSelect
// нельзя передавать из серверных компонентов (80-16).
// С children триггером становится сам блок (профиль в сайдбаре), без отдельной иконки-кнопки.
export function AccountMenu({
  children,
  triggerClassName,
}: {
  children?: ReactNode;
  triggerClassName?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Меню аккаунта"
        className={
          triggerClassName ??
          "flex size-11 items-center justify-center rounded-full bg-white text-[#0A0D12] shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-[#0A0D12] focus-visible:ring-offset-2"
        }
      >
        {children ?? <UserRound className="size-5" aria-hidden />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="p-2">
        <DropdownMenuItem asChild onSelect={(e) => e.preventDefault()}>
          <SignOutButton className="h-11 w-full justify-start rounded-full border-0 bg-transparent px-4 text-sm font-semibold shadow-none" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
