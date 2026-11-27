import { redirect } from "next/navigation";
import { callQuery } from "@/lib/convexServer";
import { api } from "@/lib/convexApi";
import { PageHeader } from "@/components/cabinet/PageHeader";
import { PendingList } from "@/components/patients/PendingList";

// Вкладка «Пациенты»: подключения, которых врач ждёт на подтверждение
// (awaiting_install, awaiting_patient, expired). Активные пациенты показаны на «Главной».
// Статус врача проверяет вызывающая страница.
export async function PendingOverview() {
  const pending = await callQuery(api.connect.listPending, {});
  if (!pending.ok) redirect("/");

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Пациенты" />
      <section aria-label="Ожидают подтверждения" className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-td-ink">Ожидают подтверждения</h2>
        <PendingList connections={pending.connections} />
        {pending.truncated ? (
          <p className="text-sm text-td-ink-2">Показаны последние 200 подключений</p>
        ) : null}
      </section>
    </div>
  );
}
