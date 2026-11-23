import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { ResetRequestForm } from "./ResetRequestForm";

export const metadata: Metadata = { title: "Восстановление пароля" };

export default function ResetPasswordPage() {
  return (
    <AuthCard title="Восстановление пароля">
      <ResetRequestForm />
      <Link href="/sign-in" className="text-sm font-normal text-[#0A0D12] underline underline-offset-4">
        Вернуться ко входу
      </Link>
    </AuthCard>
  );
}
