import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { callQuery } from "@/lib/convexServer";
import { api } from "@/lib/convexApi";
import { routeForStage } from "@/lib/stage";
import { PendingScreen } from "@/components/cabinet/PendingScreen";
import { RejectedScreen } from "@/components/cabinet/RejectedScreen";
import { PatientsOverview } from "@/components/patients/PatientsOverview";

export const metadata: Metadata = { title: "Пациенты" };

// Неверифицированный врач видит экран своей заявки; шлюз Convex отклонит вызовы в любом случае.
export default async function PatientsPage() {
  const profile = await callQuery(api.doctor.getMyProfile, {});
  if (!profile.ok) {
    redirect(routeForStage(profile));
  }
  if (profile.status === "pending") return <PendingScreen profile={profile} />;
  if (profile.status === "rejected") return <RejectedScreen />;

  return <PatientsOverview title="Пациенты" isHome={false} />;
}
