import { redirect } from "next/navigation";
import { callMutation } from "@/lib/convexServer";
import { api } from "@/lib/convexApi";
import { routeForStage } from "@/lib/stage";
import { PageHeader } from "@/components/cabinet/PageHeader";
import { VerifiedEmpty } from "@/components/cabinet/VerifiedEmpty";
import { PatientList } from "@/components/patients/PatientList";

const LIST_ERROR = "Не удалось загрузить список пациентов. Проверьте соединение и обновите страницу.";

// Экран «Главная» для verified-врача: обзор активных пациентов. Ожидающие подтверждения
// показываются на вкладке «Пациенты» (PendingOverview). Статус врача проверяет вызывающая страница.
export async function PatientsOverview() {
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
        return <VerifiedEmpty />;
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Главная" expand />
      <section className="flex flex-col gap-3">
        {list && list.ok ? (
          <PatientList initialData={list} />
        ) : (
          <p className="text-base text-td-ink-2">{LIST_ERROR}</p>
        )}
      </section>
    </div>
  );
}
