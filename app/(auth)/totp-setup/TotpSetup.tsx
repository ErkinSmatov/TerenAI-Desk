"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { TriangleAlert } from "lucide-react";
import { confirmTotpAction, startTotpEnrollment } from "@/app/actions/totp";
import { CodeInput } from "@/components/auth/CodeInput";
import { FieldError } from "@/components/auth/FieldError";
import { FormError } from "@/components/auth/FormError";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TOTP_MESSAGES } from "@/lib/totpErrors";
import { totpCodeSchema } from "@/lib/validation";

type Enrollment = { uri: string; secretBase32: string };

// otpauth-URI и ключ живут только в состоянии компонента: не в URL, не в хранилище, не в логах.
export function TotpSetup() {
  const router = useRouter();
  const started = useRef(false);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Защита от двойного эффекта: повторный begin заменил бы секрет.
    if (started.current) return;
    started.current = true;
    startTotpEnrollment()
      .then((result) => {
        if ("redirectTo" in result) router.replace(result.redirectTo);
        else if ("error" in result) setLoadError(result.error);
        else setEnrollment({ uri: result.uri, secretBase32: result.secretBase32 });
      })
      .catch(() => setLoadError(TOTP_MESSAGES.generic));
  }, [router]);

  async function onCopy() {
    if (!enrollment) return;
    try {
      await navigator.clipboard.writeText(enrollment.secretBase32);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Буфер недоступен: ключ можно переписать вручную.
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (pending || !enrollment) return;
    setFormError(null);
    const parsed = totpCodeSchema.safeParse(code);
    if (!parsed.success) {
      setCodeError(parsed.error.issues[0]?.message);
      return;
    }
    setCodeError(undefined);
    setPending(true);
    try {
      const result = await confirmTotpAction(parsed.data);
      if ("redirectTo" in result) {
        router.replace(result.redirectTo);
        return;
      }
      setFormError(result.error);
      setCode("");
    } catch {
      setFormError(TOTP_MESSAGES.generic);
    }
    setPending(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl leading-[1.2] font-semibold">Защитите вход вторым фактором</h2>
      <ol className="list-decimal space-y-2 pl-5 text-base font-normal text-[#0A0D12]">
        <li>
          Установите приложение для кодов: Google Authenticator, Microsoft Authenticator, 2FAS или Aegis.
        </li>
        <li>Отсканируйте QR-код камерой в этом приложении.</li>
        <li>Введите 6-значный код, который покажет приложение.</li>
      </ol>

      <div className="flex justify-center">
        {enrollment ? (
          <div className="rounded-2xl bg-white p-4">
            <QRCodeSVG value={enrollment.uri} size={192} level="M" bgColor="#FFFFFF" fgColor="#000000" />
          </div>
        ) : loadError ? null : (
          <Skeleton className="size-[192px] rounded-2xl" aria-label="QR-код загружается" />
        )}
      </div>
      <FormError message={loadError} />

      {enrollment ? (
        <details className="rounded-2xl bg-white px-4 py-3 text-sm">
          <summary className="min-h-6 cursor-pointer font-semibold">
            Не получается отсканировать? Введите ключ вручную
          </summary>
          <div className="mt-3 flex flex-col gap-2">
            <code className="rounded-lg bg-[#F7F7F7] px-3 py-2 font-mono text-base break-all select-all">
              {enrollment.secretBase32}
            </code>
            <Button
              type="button"
              variant="outline"
              onClick={onCopy}
              className="h-11 w-full rounded-full bg-white text-sm font-semibold"
            >
              {copied ? "Скопировано" : "Скопировать"}
            </Button>
          </div>
        </details>
      ) : null}

      <Alert className="rounded-2xl border-0 bg-[#FEF3C7] text-[#0A0D12]">
        <TriangleAlert aria-hidden />
        <AlertDescription className="text-[#0A0D12]">
          Кодов восстановления нет. Если вы потеряете телефон, вход возможен только после проверки личности
          администратором Teren.
        </AlertDescription>
      </Alert>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <CodeInput
          length={6}
          value={code}
          onChange={setCode}
          invalid={Boolean(codeError)}
          disabled={pending || !enrollment}
          aria-describedby={codeError ? "totp-code-error" : undefined}
          aria-label="Код из приложения"
        />
        <FieldError id="totp-code-error" message={codeError} />
        <FormError message={enrollment ? formError : null} />
        <SubmitButton pending={pending} disabled={!enrollment}>
          Подтвердить и войти
        </SubmitButton>
      </form>
    </div>
  );
}
