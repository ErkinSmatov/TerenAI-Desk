import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { UserRound } from "lucide-react";
import { getStage, routeForStage } from "@/lib/stage";
import { AdminNav } from "@/components/admin/AdminNav";
import { SignOutButton } from "@/components/auth/SignOutButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Серверная проверка (D-08, D-09): только платформенный админ со стадией ready.
// Сервер дополнительно отказывает not_admin в adminQuery/adminMutation.
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const stage = await getStage();
  if (!stage.ok || stage.stage !== "ready") {
    redirect(routeForStage(stage));
  }
  if (!stage.isPlatformAdmin) {
    redirect("/");
  }

  return (
    <>
      <header className="h-16 bg-[#F7F7F7] text-[#0A0D12] shadow-sm">
        <div className="mx-auto flex h-full w-full max-w-[1152px] items-center justify-between gap-4 px-4 sm:px-6">
          <span className="text-xl leading-[1.2] font-semibold tracking-tight">
            TerenDesk · Администрирование
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Меню аккаунта"
              className="flex size-11 items-center justify-center rounded-full bg-white text-[#0A0D12] shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-[#0A0D12] focus-visible:ring-offset-2"
            >
              <UserRound className="size-5" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="p-2">
              <DropdownMenuItem asChild onSelect={(e) => e.preventDefault()}>
                <SignOutButton className="h-11 w-full justify-start rounded-full border-0 bg-transparent px-4 text-sm font-semibold shadow-none" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-[1152px] flex-1 flex-col gap-6 px-4 py-8 sm:px-6 md:flex-row">
        <aside className="w-full shrink-0 md:w-60">
          <AdminNav />
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </>
  );
}
