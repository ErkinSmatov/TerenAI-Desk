import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { callQuery } from "@/lib/convexServer";
import { api } from "@/lib/convexApi";
import { routeForStage } from "@/lib/stage";
import { PendingScreen } from "@/components/cabinet/PendingScreen";
import { RejectedScreen } from "@/components/cabinet/RejectedScreen";
import { VerifiedEmpty } from "@/components/cabinet/VerifiedEmpty";
import { ConnectWizard } from "@/components/patients/ConnectWizard";
import { PendingList } from "@/components/patients/PendingList";

export const metadata: Metadata = { title: "Пациенты" };

// Неверифицированный врач видит экран своей заявки; шлюз Convex отклонит вызовы в любом случае.
export default async function PatientsPage() {
  const profile = await callQuery(api.doctor.getMyProfile, {});
  if (!profile.ok) {
    redirect(routeForStage(profile));
  }
  if (profile.status === "pending") return <PendingScreen profile={profile} />;
  if (profile.status === "rejected") return <RejectedScreen />;

  const pending = await callQuery(api.connect.listPending, {});
  if (!pending.ok) {
    redirect("/");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-[28px] leading-[1.2] font-semibold text-[#0A0D12]">Пациенты</h1>
        {pending.connections.length > 0 ? <ConnectWizard /> : null}
      </div>
      {pending.connections.length === 0 ? (
        <VerifiedEmpty action={<ConnectWizard />} />
      ) : (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl leading-[1.2] font-semibold text-[#0A0D12]">Ожидают подтверждения</h2>
          <PendingList connections={pending.connections} />
          {pending.truncated ? (
            <p className="text-sm text-[#5B6270]">Показаны последние 200 подключений</p>
          ) : null}
        </section>
      )}
    </div>
  );
}
