import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { StepIndicator } from "@/components/auth/StepIndicator";
import { getStage, routeForStage } from "@/lib/stage";
import { ProfileForm } from "./ProfileForm";

export const metadata: Metadata = { title: "Данные врача" };

export default async function RegisterProfilePage() {
  const stage = await getStage();
  // Только стадия needs_profile; иначе сервер отправляет на нужный шаг.
  if (!stage.ok ? routeForStage(stage) !== "/register/profile" : stage.stage !== "needs_profile") {
    redirect(routeForStage(stage));
  }
  return (
    <AuthCard
      title="Данные врача"
      description="Эти данные увидит команда Teren при проверке заявки. Документы прикладывать не нужно: мы свяжемся с вами по телефону или email."
    >
      <StepIndicator step={3} />
      <ProfileForm />
    </AuthCard>
  );
}
