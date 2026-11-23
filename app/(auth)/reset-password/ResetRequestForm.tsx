"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { FieldError } from "@/components/auth/FieldError";
import { FormError } from "@/components/auth/FormError";
import { usePendingCredentials } from "@/components/auth/PendingCredentials";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { classifyAuthError, mapAuthError } from "@/lib/authErrors";
import { resetRequestSchema } from "@/lib/validation";

const NEUTRAL_MESSAGE = "Если такой аккаунт существует, мы отправили код на этот email.";

export function ResetRequestForm() {
  const router = useRouter();
  const { signIn } = useAuthActions();
  const { setCredentials } = usePendingCredentials();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  function validate(): string | null {
    const parsed = resetRequestSchema.safeParse({ email });
    if (parsed.success) {
      setEmailError(undefined);
      return parsed.data.email;
    }
    setEmailError(parsed.error.issues[0]?.message);
    return null;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    setFormError(null);
    const normalized = validate();
    if (!normalized) return;
    setPending(true);
    try {
      await signIn("doctor-password", { email: normalized, flow: "reset" });
    } catch (error) {
      // Для несуществующего аккаунта ответ тот же, что и для существующего (T-80-10-01).
      const kind = classifyAuthError(error);
      if (kind === "rate_limited" || kind === "network") {
        setFormError(mapAuthError(error));
        setPending(false);
        return;
      }
    }
    setSent(true);
    setCredentials({ email: normalized });
    router.push("/reset-password/confirm");
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={validate}
          aria-invalid={emailError ? true : undefined}
          aria-describedby={emailError ? "email-error" : undefined}
          className="h-11 rounded-full bg-white px-4"
        />
        <FieldError id="email-error" message={emailError} />
      </div>
      {sent ? (
        <p role="status" className="text-sm font-normal text-[#5B6270]">
          {NEUTRAL_MESSAGE}
        </p>
      ) : null}
      <FormError message={formError} />
      <SubmitButton pending={pending}>Отправить код</SubmitButton>
    </form>
  );
}
