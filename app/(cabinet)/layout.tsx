import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getStage, routeForStage } from "@/lib/stage";
import { callQuery } from "@/lib/convexServer";
import { api } from "@/lib/convexApi";
import { CabinetHeader } from "@/components/cabinet/CabinetHeader";
import { Sidebar } from "@/components/cabinet/Sidebar";

// Серверная проверка стадии (критерий 2): клиентский редирект защитой не является.
// Страница динамическая: cookies читаются в корневом layout, nonce CSP сохраняется.
export default async function CabinetLayout({ children }: { children: ReactNode }) {
  const stage = await getStage();
  if (!stage.ok || stage.stage !== "ready") {
    redirect(routeForStage(stage));
  }
  if (stage.isPlatformAdmin) {
    redirect("/admin");
  }

  const profile = await callQuery(api.doctor.getMyProfile, {});
  if (!profile.ok) {
    redirect(routeForStage(profile));
  }

  // Неверифицированный врач видит экран заявки с прежней шапкой.
  if (profile.status !== "verified") {
    return (
      <>
        <CabinetHeader profile={profile} />
        <main className="mx-auto w-full max-w-[1152px] flex-1 px-4 py-8 sm:px-6">{children}</main>
      </>
    );
  }

  // Бейдж «Пациенты» в сайдбаре: подключения, ожидающие подтверждения. Ошибка запроса бейдж скрывает.
  const pending = await callQuery(api.connect.listPending, {});
  const pendingCount = pending.ok ? pending.connections.length : 0;

  return (
    <div className="min-h-screen flex-1 bg-td-bg">
      <Sidebar profile={profile} pendingCount={pendingCount} />
      <div className="lg:pl-[calc(30px+273px+20px)]">
        <main className="px-4 pt-6 pb-10 lg:px-0 lg:pt-[30px] lg:pr-[30px]">{children}</main>
      </div>
    </div>
  );
}
