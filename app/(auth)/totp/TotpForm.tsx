"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { verifyTotpAction } from "@/app/actions/totp";
import { CodeInput } from "@/components/auth/CodeInput";
import { FieldError } from "@/components/auth/FieldError";
import { FormError } from "@/components/auth/FormError";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { lockedMessage, TOTP_MESSAGES } from "@/lib/totpErrors";
import { totpCodeSchema } from "@/lib/validation";

export function TotpForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  // Момент окончания блокировки (мс, Date.now()); null — блокировки нет.
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (lockedUntil === null) return;
    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= lockedUntil) {
        setLockedUntil(null);
        setFormError(null);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [lockedUntil]);

  const locked = lockedUntil !== null && now < lockedUntil;
  const remaining = locked ? lockedUntil - now : 0;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (pending || locked) return;
    setFormError(null);
    const parsed = totpCodeSchema.safeParse(code);
    if (!parsed.success) {
      setCodeError(parsed.error.issues[0]?.message);
      return;
    }
    setCodeError(undefined);
    setPending(true);
    try {
      const result = await verifyTotpAction(parsed.data);
      if ("redirectTo" in result) {
        router.replace(result.redirectTo);
        return;
      }
      setCode("");
      if (result.retryAfterMs !== undefined && result.retryAfterMs > 0) {
        const start = Date.now();
        setNow(start);
        setLockedUntil(start + result.retryAfterMs);
      } else {
        setFormError(result.error);
      }
    } catch {
      setFormError(TOTP_MESSAGES.generic);
    }
    setPending(false);
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <p className="text-base font-normal text-[#5B6270]">
        Откройте приложение для кодов и введите 6-значный код.
      </p>
      <CodeInput
        length={6}
        value={code}
        onChange={setCode}
        invalid={Boolean(codeError)}
        disabled={pending || locked}
        aria-describedby={codeError ? "totp-code-error" : undefined}
        aria-label="Код из приложения"
      />
      <FieldError id="totp-code-error" message={codeError} />
      <FormError message={locked ? lockedMessage(remaining) : formError} />
      <SubmitButton pending={pending} disabled={locked}>
        Подтвердить код
      </SubmitButton>
      <div className="flex justify-center">
        <SignOutButton />
      </div>
    </form>
  );
}
