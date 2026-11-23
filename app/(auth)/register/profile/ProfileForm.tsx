"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { submitProfile } from "@/app/actions/registration";
import { FieldError } from "@/components/auth/FieldError";
import { FormError } from "@/components/auth/FormError";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { profileSchema } from "@/lib/validation";

type FieldName = "fullName" | "requestedClinic" | "specialty" | "phone";

const FIELDS: Array<{
  name: FieldName;
  label: string;
  hint?: string;
  placeholder?: string;
  autoComplete?: string;
  type?: string;
}> = [
  { name: "fullName", label: "ФИО", autoComplete: "name" },
  {
    name: "requestedClinic",
    label: "Клиника",
    hint: "Как называется клиника, в которой вы работаете",
    autoComplete: "organization",
  },
  { name: "specialty", label: "Специальность" },
  {
    name: "phone",
    label: "Телефон",
    placeholder: "+7 700 000 00 00",
    autoComplete: "tel",
    type: "tel",
  },
];

export function ProfileForm() {
  const router = useRouter();
  const [values, setValues] = useState<Record<FieldName, string>>({
    fullName: "",
    requestedClinic: "",
    specialty: "",
    phone: "",
  });
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function validateField(name: FieldName, value: string) {
    const result = profileSchema.shape[name].safeParse(value);
    setErrors((prev) => ({ ...prev, [name]: result.success ? undefined : result.error.issues[0]?.message }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    setFormError(null);
    const parsed = profileSchema.safeParse(values);
    if (!parsed.success) {
      const next: Partial<Record<FieldName, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as FieldName;
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    setPending(true);
    try {
      const result = await submitProfile(parsed.data);
      if ("redirectTo" in result) {
        router.replace(result.redirectTo);
        return;
      }
      if ("fieldErrors" in result) setErrors(result.fieldErrors);
      else setFormError(result.error);
    } catch {
      setFormError("Не удалось отправить заявку. Проверьте соединение и попробуйте ещё раз.");
    }
    setPending(false);
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {FIELDS.map((f) => {
        const errId = `${f.name}-error`;
        const hintId = `${f.name}-hint`;
        const describedBy = [f.hint ? hintId : null, errors[f.name] ? errId : null].filter(Boolean).join(" ");
        return (
          <div key={f.name} className="flex flex-col gap-2">
            <Label htmlFor={f.name} className="text-sm font-semibold">
              {f.label}
            </Label>
            <Input
              id={f.name}
              name={f.name}
              type={f.type ?? "text"}
              value={values[f.name]}
              placeholder={f.placeholder}
              autoComplete={f.autoComplete}
              disabled={pending}
              aria-invalid={errors[f.name] ? true : undefined}
              aria-describedby={describedBy || undefined}
              onChange={(e) => setValues((prev) => ({ ...prev, [f.name]: e.target.value }))}
              onBlur={(e) => validateField(f.name, e.target.value)}
              className="h-11 bg-white"
            />
            {f.hint ? (
              <p id={hintId} className="text-sm leading-normal font-normal text-[#5B6270]">
                {f.hint}
              </p>
            ) : null}
            <FieldError id={errId} message={errors[f.name]} />
          </div>
        );
      })}
      <FormError message={formError} />
      <SubmitButton pending={pending}>Отправить заявку</SubmitButton>
    </form>
  );
}
