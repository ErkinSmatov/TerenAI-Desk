import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { ResetConfirmForm } from "./ResetConfirmForm";

export const metadata: Metadata = { title: "Новый пароль" };

export default function ResetPasswordConfirmPage() {
  return (
    <AuthCard title="Новый пароль">
      <ResetConfirmForm />
    </AuthCard>
  );
}
