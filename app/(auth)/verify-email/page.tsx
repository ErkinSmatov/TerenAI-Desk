import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { StepIndicator } from "@/components/auth/StepIndicator";
import { VerifyEmailForm } from "./VerifyEmailForm";

export const metadata: Metadata = { title: "Подтверждение email" };

export default function VerifyEmailPage() {
  return (
    <AuthCard title="Подтверждение email">
      <StepIndicator step={2} />
      <VerifyEmailForm />
    </AuthCard>
  );
}
