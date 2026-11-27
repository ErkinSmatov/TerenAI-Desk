import type { ClinicRole } from "@/lib/convexApi";
import { clinicRoleLabel } from "@/lib/labels";
import { CabinetNav } from "@/components/cabinet/CabinetNav";
import { AccountMenu } from "@/components/auth/AccountMenu";
import { ConnectWizard } from "@/components/patients/ConnectWizard";

type SidebarProfile = {
  fullName: string;
  clinicName: string | null;
  clinicRole: ClinicRole | null;
};

function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((p) => Array.from(p)[0]?.toUpperCase() ?? "");
  return letters.join("") || "?";
}

// Левый сайдбар 273px (десктоп). На узких экранах превращается в верхнюю панель.
export function Sidebar({ profile }: { profile: SidebarProfile }) {
  const showClinic = profile.clinicName && profile.clinicRole;
  return (
    <aside className="z-20 flex flex-col gap-4 px-4 py-4 text-td-ink lg:fixed lg:inset-y-0 lg:left-[30px] lg:w-[273px] lg:gap-0 lg:p-0 lg:py-[30px]">
      <div className="flex items-center justify-between gap-3 lg:mb-10 lg:justify-start lg:px-6">
        <span className="text-base font-semibold tracking-tight">TerenDesk</span>
        <div className="lg:hidden">
          <AccountMenu />
        </div>
      </div>
      <CabinetNav />
      <div className="flex flex-col gap-3 lg:mt-auto">
        <ConnectWizard variant="sidebar" />
        <div className="flex items-center gap-3 rounded-[40px] bg-td-pill p-2 max-lg:hidden">
          <span
            aria-hidden
            className="flex size-[60px] shrink-0 items-center justify-center rounded-full bg-td-accent text-lg font-semibold"
          >
            {initials(profile.fullName)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{profile.fullName}</p>
            {showClinic ? (
              <p className="truncate text-xs text-td-ink-2">
                {profile.clinicName} · {clinicRoleLabel(profile.clinicRole!)}
              </p>
            ) : null}
          </div>
          <AccountMenu />
        </div>
      </div>
    </aside>
  );
}
