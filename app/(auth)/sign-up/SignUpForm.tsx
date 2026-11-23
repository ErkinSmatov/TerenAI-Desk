"use client";

import { useState, type FormEvent } from "react";
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
import { classifyAuthError, mapAuthError } from "@/lib/authErrors";
import { signUpSchema } from "@/lib/validation";

type Key = "email" | "password" | "passwordConfirm";
type FieldErrors = Partial<Record<Key, string>>;

export function SignUpForm() {
  const router = useRouter();
  const { signIn } = useAuthActions();
  const { setCredentials } = usePendingCredentials();
  const [values, setValues] = useState({ email: "", password: "", passwordConfirm: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function set(key: Key, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function validateField(key: Key) {
    const parsed = signUpSchema.safeParse(values);
    const issue = parsed.success ? undefined : parsed.error.issues.find((i) => i.path[0] === key);
    setErrors((prev) => ({ ...prev, [key]: issue?.message }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    setFormError(null);
    const parsed = signUpSchema.safeParse(values);
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as Key;
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    const { email, password } = parsed.data;
    setPending(true);
    try {
      const result = await signIn("doctor-password", { email, password, flow: "signUp" });
      if (result.signingIn) {
        const { redirectTo } = await afterPasswordSignIn();
        router.replace(redirectTo);
        return;
      }
    } catch (error) {
      // Занятость email не раскрывается: любой исход, кроме слабого пароля,
      // лимита и сетевой ошибки, ведёт на ввод кода одинаково (D-03).
      const kind = classifyAuthError(error);
      if (kind === "weak_password" || kind === "rate_limited" || kind === "network") {
        setFormError(mapAuthError(error));
        setPending(false);
        return;
      }
    }
    setCredentials({ email, password });
    router.push("/verify-email");
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={(e) => set("email", e.target.value)}
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
          autoComplete="new-password"
          value={values.password}
          onChange={(e) => set("password", e.target.value)}
          onBlur={() => validateField("password")}
          aria-invalid={errors.password ? true : undefined}
        />
        <FieldError id="password-error" message={errors.password} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="passwordConfirm">Повторите пароль</Label>
        <PasswordInput
          id="passwordConfirm"
          autoComplete="new-password"
          showHint={false}
          value={values.passwordConfirm}
          onChange={(e) => set("passwordConfirm", e.target.value)}
          onBlur={() => validateField("passwordConfirm")}
          aria-invalid={errors.passwordConfirm ? true : undefined}
          aria-describedby={errors.passwordConfirm ? "passwordConfirm-error" : undefined}
        />
        <FieldError id="passwordConfirm-error" message={errors.passwordConfirm} />
      </div>
      <FormError message={formError} />
      <SubmitButton pending={pending}>Создать аккаунт</SubmitButton>
    </form>
  );
}
