import { redirect } from "next/navigation";
import { callMutation, callQuery } from "@/lib/convexServer";
import { api } from "@/lib/convexApi";
import { routeForStage } from "@/lib/stage";
import { VerifiedEmpty } from "@/components/cabinet/VerifiedEmpty";
import { PatientList } from "@/components/patients/PatientList";
import { PendingList } from "@/components/patients/PendingList";

const LIST_ERROR = "Не удалось загрузить список пациентов. Проверьте соединение и обновите страницу.";

// Общий экран «Главная» / «Пациенты» для verified-врача: ожидающие согласия и список с карточками.
// Статус врача проверяет вызывающая страница. Логика загрузки без изменений относительно 82-11.
export async function PatientsOverview({ title, isHome }: { title: string; isHome: boolean }) {
  const pending = await callQuery(api.connect.listPending, {});
  if (!pending.ok) {
    // С главной редирект на "/" зациклился бы: показываем пустое состояние.
    if (isHome) return <VerifiedEmpty />;
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
        if (isHome) return <VerifiedEmpty />;
        redirect("/");
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-[40px] leading-[1.1] font-semibold tracking-[-0.6px] text-td-ink max-sm:text-[32px]">
        {title}
      </h1>
      {pending.connections.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-td-ink">Ожидают согласия</h2>
          <PendingList connections={pending.connections} />
          {pending.truncated ? (
            <p className="text-sm text-td-ink-2">Показаны последние 200 подключений</p>
          ) : null}
        </section>
      ) : null}
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
