"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { afterPasswordSignIn } from "@/app/actions/auth";
import { CodeInput } from "@/components/auth/CodeInput";
import { FieldError } from "@/components/auth/FieldError";
import { FormError } from "@/components/auth/FormError";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { usePendingCredentials } from "@/components/auth/PendingCredentials";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { Label } from "@/components/ui/label";
import { mapAuthError } from "@/lib/authErrors";
import { MSG, resetConfirmSchema } from "@/lib/validation";

type Key = "code" | "newPassword" | "passwordConfirm";
type FieldErrors = Partial<Record<Key, string>>;

export function ResetConfirmForm() {
  const router = useRouter();
  const { signIn } = useAuthActions();
  const { email, clearCredentials } = usePendingCredentials();
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!email && !pending) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-base text-[#5B6270]">
          Данные для сброса не сохранились. Запросите код ещё раз.
        </p>
        <Link
          href="/reset-password"
          className="text-sm font-normal text-[#0A0D12] underline underline-offset-4"
        >
          Восстановить пароль
        </Link>
      </div>
    );
  }

  function validate(): { code: string; newPassword: string } | null {
    const next: FieldErrors = {};
    const parsed = resetConfirmSchema.safeParse({ email, code, newPassword });
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if ((key === "code" || key === "newPassword") && !next[key]) next[key] = issue.message;
      }
    }
    if (!passwordConfirm) next.passwordConfirm = MSG.required;
    else if (passwordConfirm !== newPassword) next.passwordConfirm = MSG.passwordMismatch;
    setErrors(next);
    return Object.keys(next).length === 0 && parsed.success
      ? { code: parsed.data.code, newPassword: parsed.data.newPassword }
      : null;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    setFormError(null);
    const data = validate();
    if (!data) return;
    setPending(true);
    try {
      await signIn("doctor-password", {
        email,
        code: data.code,
        newPassword: data.newPassword,
        flow: "reset-verification",
      });
      // Второй фактор обязателен и после сброса: маршрут определяет стадия.
      const { redirectTo } = await afterPasswordSignIn();
      router.replace(redirectTo);
      // WR-01: контекст очищается после перехода, иначе форма сменится на «данные не сохранились».
      clearCredentials();
    } catch (error) {
      setFormError(mapAuthError(error));
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <p className="text-base font-normal text-[#5B6270]">
        Если такой аккаунт существует, мы отправили код на этот email. Введите код и новый пароль.
      </p>
      <CodeInput
        length={8}
        value={code}
        onChange={setCode}
        invalid={Boolean(errors.code)}
        disabled={pending}
        aria-describedby={errors.code ? "code-error" : undefined}
        aria-label="Код из письма"
      />
      <FieldError id="code-error" message={errors.code} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="newPassword">Новый пароль</Label>
        <PasswordInput
          id="newPassword"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          aria-invalid={errors.newPassword ? true : undefined}
        />
        <FieldError id="newPassword-error" message={errors.newPassword} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="passwordConfirm">Повторите пароль</Label>
        <PasswordInput
          id="passwordConfirm"
          autoComplete="new-password"
          showHint={false}
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          aria-invalid={errors.passwordConfirm ? true : undefined}
          aria-describedby={errors.passwordConfirm ? "passwordConfirm-error" : undefined}
        />
        <FieldError id="passwordConfirm-error" message={errors.passwordConfirm} />
      </div>
      <FormError message={formError} />
      <SubmitButton pending={pending}>Сохранить пароль</SubmitButton>
    </form>
  );
}
