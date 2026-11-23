import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { getStage, routeForStage } from "@/lib/stage";
import { TotpForm } from "./TotpForm";

export const metadata: Metadata = { title: "Код из приложения" };

export default async function TotpPage() {
  const stage = await getStage();
  if (!stage.ok ? routeForStage(stage) !== "/totp" : stage.stage !== "needs_totp") {
    redirect(routeForStage(stage));
  }
  return (
    <AuthCard title="Код из приложения">
      <TotpForm />
    </AuthCard>
  );
}
