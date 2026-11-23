"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { afterPasswordSignIn } from "@/app/actions/auth";
import { FieldError } from "@/components/auth/FieldError";
import { FormError } from "@/components/auth/FormError";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { usePendingCredentials } from "@/components/auth/PendingCredentials";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AUTH_MESSAGES, mapAuthError } from "@/lib/authErrors";
import { signInSchema } from "@/lib/validation";

type FieldErrors = { email?: string; password?: string };

export function SignInForm({ expired }: { expired: boolean }) {
  const router = useRouter();
  const { signIn, signOut } = useAuthActions();
  const { setCredentials } = usePendingCredentials();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Просроченная сессия: закрываем её на клиенте и показываем баннер.
  useEffect(() => {
    if (expired) void signOut().catch(() => undefined);
  }, [expired, signOut]);

  function validate(): { email: string; password: string } | null {
    const parsed = signInSchema.safeParse({ email, password });
    if (parsed.success) {
      setErrors({});
      return parsed.data;
    }
    const next: FieldErrors = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if ((key === "email" || key === "password") && !next[key]) next[key] = issue.message;
    }
    setErrors(next);
    return null;
  }

  function validateField(key: "email" | "password") {
    const parsed = signInSchema.safeParse({ email, password });
    const issue = parsed.success ? undefined : parsed.error.issues.find((i) => i.path[0] === key);
    setErrors((prev) => ({ ...prev, [key]: issue?.message }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    setFormError(null);
    const data = validate();
    if (!data) return;
    setPending(true);
    try {
      const result = await signIn("doctor-password", {
        email: data.email,
        password: data.password,
        flow: "signIn",
      });
      if (!result.signingIn) {
        // Требуется подтверждение email: данные только в памяти.
        setCredentials({ email: data.email, password: data.password });
        router.push("/verify-email");
        return;
      }
      const { redirectTo } = await afterPasswordSignIn();
      router.replace(redirectTo);
    } catch (error) {
      setFormError(mapAuthError(error));
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {expired ? (
        <div role="status" className="rounded-2xl bg-[#FEF3C7] px-4 py-3 text-sm text-[#0A0D12]">
          {AUTH_MESSAGES.sessionExpired}
        </div>
      ) : null}
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => validateField("email")}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? "email-error" : undefined}
          className="h-11 rounded-full bg-white px-4"
        />
        <FieldError id="email-error" message={errors.email} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Пароль</Label>
        <PasswordInput
          id="password"
          autoComplete="current-password"
          showHint={false}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => validateField("password")}
          aria-invalid={errors.password ? true : undefined}
          aria-describedby={errors.password ? "password-error" : undefined}
        />
        <FieldError id="password-error" message={errors.password} />
      </div>
      <FormError message={formError} />
      <SubmitButton pending={pending}>Войти</SubmitButton>
    </form>
  );
}
