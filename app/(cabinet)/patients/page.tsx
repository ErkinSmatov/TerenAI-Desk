import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { callMutation, callQuery } from "@/lib/convexServer";
import { api } from "@/lib/convexApi";
import { routeForStage } from "@/lib/stage";
import { PendingScreen } from "@/components/cabinet/PendingScreen";
import { RejectedScreen } from "@/components/cabinet/RejectedScreen";
import { ConnectWizard } from "@/components/patients/ConnectWizard";
import { PatientList } from "@/components/patients/PatientList";
import { PendingList } from "@/components/patients/PendingList";

export const metadata: Metadata = { title: "Пациенты" };

const LIST_ERROR = "Не удалось загрузить список пациентов. Проверьте соединение и обновите страницу.";

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

  // Список считается мутацией (аудит просмотра, D-02); ответ и ошибки не логируются.
  let list;
  try {
    list = await callMutation(api.patients.list, {});
  } catch {
    list = null;
  }
  if (list && !list.ok) {
    switch (list.code) {
      case "unauthenticated":
      case "2fa_required":
      case "session_expired":
        redirect(routeForStage({ ok: false, code: list.code }));
      case "not_verified":
      case "not_doctor_account":
      case "no_doctor_profile":
      case "no_clinic":
        redirect("/");
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-[28px] leading-[1.2] font-semibold text-[#0A0D12]">Пациенты</h1>
        <ConnectWizard />
      </div>
      {pending.connections.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl leading-[1.2] font-semibold text-[#0A0D12]">Ожидают согласия</h2>
          <PendingList connections={pending.connections} />
          {pending.truncated ? (
            <p className="text-sm text-[#5B6270]">Показаны последние 200 подключений</p>
          ) : null}
        </section>
      ) : null}
      <section className="flex flex-col gap-3">
        <h2 className="text-xl leading-[1.2] font-semibold text-[#0A0D12]">Мои пациенты</h2>
        {list && list.ok ? (
          <PatientList initialData={list} />
        ) : (
          <p className="text-base text-[#5B6270]">{LIST_ERROR}</p>
        )}
      </section>
    </div>
  );
}
