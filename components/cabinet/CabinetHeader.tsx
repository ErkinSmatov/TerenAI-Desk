import { UserRound } from "lucide-react";
import type { ClinicRole, DoctorStatus } from "@/lib/convexApi";
import { clinicRoleLabel } from "@/lib/labels";
import { StatusBadge } from "@/components/cabinet/StatusBadge";
import { SignOutButton } from "@/components/auth/SignOutButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type HeaderProfile = {
  fullName: string;
  status: DoctorStatus;
  clinicName: string | null;
  clinicRole: ClinicRole | null;
};

// Шапка 64px. Для verified под ФИО показываются клиника и роль (DAUTH-03).
export function CabinetHeader({ profile }: { profile: HeaderProfile }) {
  const showClinic = profile.status === "verified" && profile.clinicName && profile.clinicRole;
  return (
    <header className="h-16 bg-[#F7F7F7] text-[#0A0D12] shadow-sm">
      <div className="mx-auto flex h-full w-full max-w-[1152px] items-center justify-between gap-4 px-4 sm:px-6">
        <span className="text-xl leading-[1.2] font-semibold tracking-tight">TerenDesk</span>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-sm leading-[1.4] font-semibold">{profile.fullName}</span>
            {showClinic ? (
              <span className="text-sm leading-[1.4] font-normal text-[#5B6270]">
                {profile.clinicName} · {clinicRoleLabel(profile.clinicRole!)}
              </span>
            ) : null}
          </div>
          <StatusBadge status={profile.status} />
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
      </div>
    </header>
  );
}
