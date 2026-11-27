import type { ClinicRole } from "@/lib/convexApi";
import { initialsOf } from "@/lib/patientListView";
import { clinicRoleLabel } from "@/lib/labels";
import { CabinetNav } from "@/components/cabinet/CabinetNav";
import { AccountMenu } from "@/components/auth/AccountMenu";
import { ConnectWizard } from "@/components/patients/ConnectWizard";

type SidebarProfile = {
  fullName: string;
  clinicName: string | null;
  clinicRole: ClinicRole | null;
};

// Левый сайдбар 273px (десктоп). На узких экранах превращается в верхнюю панель.
export function Sidebar({
  profile,
  pendingCount,
}: {
  profile: SidebarProfile;
  pendingCount: number;
}) {
  const showClinic = profile.clinicName && profile.clinicRole;
  return (
    <aside className="z-20 flex flex-col gap-4 px-4 py-4 text-td-ink lg:fixed lg:inset-y-0 lg:left-[30px] lg:w-[273px] lg:gap-0 lg:p-0 lg:py-[30px]">
      <div className="flex items-center justify-between gap-3 lg:mb-[46px] lg:justify-start lg:px-6">
        <span className="text-base font-semibold tracking-[-0.6px]">TerenDesk</span>
        <div className="lg:hidden">
          <AccountMenu />
        </div>
      </div>
      <CabinetNav pendingCount={pendingCount} />
      <div className="flex flex-col gap-1 lg:mt-auto">
        <ConnectWizard variant="sidebar" />
        <div className="max-lg:hidden">
          <AccountMenu triggerClassName="flex w-full items-center gap-1 rounded-[40px] bg-td-pill p-[2px] pr-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-td-ink focus-visible:ring-offset-2">
            <span
              aria-hidden
              className="flex size-[60px] shrink-0 items-center justify-center rounded-full bg-td-accent text-2xl font-bold"
            >
              {initialsOf(profile.fullName)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-base font-semibold">{profile.fullName}</span>
              {showClinic ? (
                <span className="block truncate text-base text-td-ink-2">
                  {profile.clinicName} · {clinicRoleLabel(profile.clinicRole!)}
                </span>
              ) : null}
            </span>
          </AccountMenu>
        </div>
      </div>
    </aside>
  );
}
