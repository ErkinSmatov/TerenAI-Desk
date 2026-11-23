import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getStage, routeForStage } from "@/lib/stage";
import { callQuery } from "@/lib/convexServer";
import { api } from "@/lib/convexApi";
import { CabinetHeader } from "@/components/cabinet/CabinetHeader";

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

  return (
    <>
      <CabinetHeader profile={profile} />
      <main className="mx-auto w-full max-w-[1152px] flex-1 px-4 py-8 sm:px-6">{children}</main>
    </>
  );
}
