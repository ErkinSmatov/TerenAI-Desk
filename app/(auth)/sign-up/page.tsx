import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { StepIndicator } from "@/components/auth/StepIndicator";
import { SignUpForm } from "./SignUpForm";

export const metadata: Metadata = { title: "Регистрация врача" };

export default function SignUpPage() {
  return (
    <AuthCard title="Регистрация врача">
      <StepIndicator step={1} />
      <p className="text-sm font-semibold text-[#0A0D12]">Аккаунт</p>
      <SignUpForm />
      <Link href="/sign-in" className="text-sm font-normal text-[#0A0D12] underline underline-offset-4">
        Уже есть аккаунт? Войти
      </Link>
    </AuthCard>
  );
}
