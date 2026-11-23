import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isAuthenticatedNextjs } from "@convex-dev/auth/nextjs/server";
import { AuthCard } from "@/components/auth/AuthCard";
import { getStage, routeForStage } from "@/lib/stage";
import { SignInForm } from "./SignInForm";

export const metadata: Metadata = { title: "Вход" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function SignInPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const expired = params.expired === "1";

  if (!expired && (await isAuthenticatedNextjs())) {
    const target = routeForStage(await getStage());
    // Маршруты /sign-in исключаем, иначе возможен цикл редиректов.
    if (!target.startsWith("/sign-in")) redirect(target);
  }

  return (
    <AuthCard title="Вход">
      <SignInForm expired={expired} />
      <div className="flex flex-col gap-2 text-sm font-normal">
        <Link href="/reset-password" className="text-[#0A0D12] underline underline-offset-4">
          Забыли пароль?
        </Link>
        <Link href="/sign-up" className="text-[#0A0D12] underline underline-offset-4">
          Создать аккаунт
        </Link>
      </div>
    </AuthCard>
  );
}
