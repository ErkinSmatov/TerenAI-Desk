import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { callQuery } from "@/lib/convexServer";
import { api } from "@/lib/convexApi";
import { routeForStage } from "@/lib/stage";
import { PendingScreen } from "@/components/cabinet/PendingScreen";
import { RejectedScreen } from "@/components/cabinet/RejectedScreen";
import { VerifiedEmpty } from "@/components/cabinet/VerifiedEmpty";

export const metadata: Metadata = { title: "Кабинет" };

// Layout и page рендерятся независимо, поэтому профиль запрашивается повторно.
// Данные только из сессии (getMyProfile без аргументов), страница динамическая.
export default async function CabinetPage() {
  const profile = await callQuery(api.doctor.getMyProfile, {});
  if (!profile.ok) {
    redirect(routeForStage(profile));
  }
  switch (profile.status) {
    case "pending":
      return <PendingScreen profile={profile} />;
    case "rejected":
      return <RejectedScreen />;
    case "verified":
      return <VerifiedEmpty />;
  }
}
