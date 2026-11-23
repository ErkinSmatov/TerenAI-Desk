import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { StepIndicator } from "@/components/auth/StepIndicator";
import { getStage, routeForStage } from "@/lib/stage";
import { TotpSetup } from "./TotpSetup";

export const metadata: Metadata = { title: "Защита входа" };

export default async function TotpSetupPage() {
  const stage = await getStage();
  if (!stage.ok || stage.stage !== "needs_totp_setup") redirect(routeForStage(stage));
  return (
    <AuthCard title="Защита входа" className="max-w-[448px]">
      {stage.isPlatformAdmin ? null : <StepIndicator step={4} />}
      <TotpSetup />
    </AuthCard>
  );
}
