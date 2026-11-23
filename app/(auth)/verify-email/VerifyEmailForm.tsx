"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { afterPasswordSignIn } from "@/app/actions/auth";
import { CodeInput } from "@/components/auth/CodeInput";
import { FieldError } from "@/components/auth/FieldError";
import { FormError } from "@/components/auth/FormError";
import { usePendingCredentials } from "@/components/auth/PendingCredentials";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { Button } from "@/components/ui/button";
import { mapAuthError } from "@/lib/authErrors";
import { emailCodeSchema } from "@/lib/validation";

const RESEND_SECONDS = 60;

export function VerifyEmailForm() {
  const router = useRouter();
  const { signIn } = useAuthActions();
  const { email, password } = usePendingCredentials();
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [resendLeft, setResendLeft] = useState(RESEND_SECONDS);

  // Код только что отправлен, поэтому повторная отправка заблокирована сразу на 60 секунд.
  useEffect(() => {
    if (resendLeft <= 0) return;
    const timer = setTimeout(() => setResendLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendLeft]);

  if (!email) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-base text-[#5B6270]">
          Данные для подтверждения не сохранились. Войдите снова, и мы отправим новый код.
        </p>
        <Link href="/sign-in" className="text-sm font-normal text-[#0A0D12] underline underline-offset-4">
          Войти
        </Link>
      </div>
    );
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    setFormError(null);
    const parsed = emailCodeSchema.safeParse(code);
    if (!parsed.success) {
      setCodeError(parsed.error.issues[0]?.message);
      return;
    }
    setCodeError(undefined);
    setPending(true);
    try {
      await signIn("doctor-password", { email, code: parsed.data, flow: "email-verification" });
      const { redirectTo } = await afterPasswordSignIn();
      router.replace(redirectTo);
    } catch (error) {
      setFormError(mapAuthError(error));
      setPending(false);
    }
  }

  async function onResend() {
    if (resendLeft > 0 || pending) return;
    setFormError(null);
    setResendLeft(RESEND_SECONDS);
    try {
      // Повторный вход неподтверждённого аккаунта заново отправляет код.
      await signIn("doctor-password", { email, password, flow: "signIn" });
    } catch (error) {
      setFormError(mapAuthError(error));
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <p className="text-base font-normal text-[#5B6270]">
        Мы отправили код на {email}. Введите его, чтобы продолжить.
      </p>
      <CodeInput
        length={8}
        value={code}
        onChange={setCode}
        invalid={Boolean(codeError)}
        disabled={pending}
        aria-describedby={codeError ? "code-error" : undefined}
        aria-label="Код из письма"
      />
      <FieldError id="code-error" message={codeError} />
      <FormError message={formError} />
      <SubmitButton pending={pending}>Подтвердить email</SubmitButton>
      <Button
        type="button"
        variant="outline"
        onClick={onResend}
        disabled={resendLeft > 0 || pending}
        className="h-11 w-full rounded-full bg-white text-sm font-semibold"
      >
        {resendLeft > 0 ? `Отправить код ещё раз (${resendLeft} с)` : "Отправить код ещё раз"}
      </Button>
    </form>
  );
}
