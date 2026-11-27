"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import {
  confirmPhoneAction,
  getConnectionStateAction,
  redeemPatientCodeAction,
  startPhoneAction,
} from "@/app/actions/connect";
import { CONNECT_COUNTRIES, DEFAULT_CONNECT_COUNTRY } from "@/lib/phoneCountries";
import { CodeInput } from "@/components/auth/CodeInput";
import { FormError } from "@/components/auth/FormError";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const POLL_INTERVAL_MS = 1500;
const POLL_MAX_MS = 60_000;
const PRIMARY =
  "h-11 rounded-full bg-[#C9F14C] px-5 font-semibold text-[#0A0D12] hover:bg-[#BDE63F]";
const SECONDARY =
  "h-11 rounded-full border border-[#E5E7EB] bg-white px-5 font-semibold text-[#0A0D12] hover:bg-[#F4F5F7]";

type SendState = "sending" | "sent" | "failed" | "timeout";
type PhoneResult = "awaiting_patient" | "awaiting_install" | "already_connected" | "unavailable";

const PHONE_RESULT_TEXT: Record<PhoneResult, string> = {
  awaiting_patient: "Запрос отправлен пациенту. Доступ откроется после его подтверждения в приложении.",
  awaiting_install:
    "Номер подтверждён. Попросите пациента установить приложение Teren и войти по этому номеру. Подключение действует 30 дней.",
  already_connected: "Пациент уже подключён к вам.",
  unavailable: "Подключение сейчас недоступно. Попробуйте позже.",
};

function phoneResultText(status: string): string {
  return PHONE_RESULT_TEXT[status as PhoneResult] ?? PHONE_RESULT_TEXT.unavailable;
}

export function ConnectWizard({ variant = "default" }: { variant?: "default" | "sidebar" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("phone");
  const [pending, startTransition] = useTransition();

  // Вкладка «По номеру телефона»
  const [country, setCountry] = useState(DEFAULT_CONNECT_COUNTRY);
  const [phone, setPhone] = useState("");
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [phoneMasked, setPhoneMasked] = useState("");
  const [sendState, setSendState] = useState<SendState>("sending");
  const [sendMessage, setSendMessage] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [canResend, setCanResend] = useState(false);
  const [phoneResult, setPhoneResult] = useState<string | null>(null);

  // Вкладка «По коду из приложения»
  const [patientCode, setPatientCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeResult, setCodeResult] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => stopPolling, [stopPolling]);

  function reset() {
    stopPolling();
    setTab("phone");
    setCountry(DEFAULT_CONNECT_COUNTRY);
    setPhone("");
    setConnectionId(null);
    setPhoneMasked("");
    setSendState("sending");
    setSendMessage(null);
    setCode("");
    setPhoneError(null);
    setCanResend(false);
    setPhoneResult(null);
    setPatientCode("");
    setCodeError(null);
    setCodeResult(null);
  }

  function finish() {
    setOpen(false);
    reset();
    router.refresh();
  }

  function startPolling(id: string) {
    stopPolling();
    setSendState("sending");
    setSendMessage(null);
    const startedAt = Date.now();
    let inFlight = false;
    timerRef.current = setInterval(async () => {
      if (inFlight) return;
      if (Date.now() - startedAt >= POLL_MAX_MS) {
        stopPolling();
        setSendState("timeout");
        return;
      }
      inFlight = true;
      try {
        const result = await getConnectionStateAction(id);
        if (timerRef.current === null) return; // опрос остановлен во время запроса
        if ("redirect" in result) {
          stopPolling();
          router.replace(result.redirect);
          return;
        }
        if (!result.ok) return;
        if (result.data.sendState === "sent") {
          stopPolling();
          setSendState("sent");
          setCanResend(true);
        } else if (result.data.sendState === "failed") {
          stopPolling();
          setSendState("failed");
          setSendMessage(result.data.message ?? null);
        }
      } finally {
        inFlight = false;
      }
    }, POLL_INTERVAL_MS);
  }

  function sendCode() {
    if (pending) return;
    setPhoneError(null);
    startTransition(async () => {
      const result = await startPhoneAction(country, phone);
      if ("redirect" in result) {
        router.replace(result.redirect);
        return;
      }
      if (!result.ok) {
        setPhoneError(result.message);
        return;
      }
      setConnectionId(result.data.connectionId);
      setPhoneMasked(result.data.phoneMasked);
      setCode("");
      setCanResend(false);
      startPolling(result.data.connectionId);
    });
  }

  // Пока код не выдан (sending) или отправка не удалась (failed), ввод бесполезен и тратит лимит.
  // timeout не блокируем: код мог прийти, сервер сам ответит code_sending.
  const codeBlocked = connectionId !== null && (sendState === "sending" || sendState === "failed");

  function confirmCode(e: React.FormEvent) {
    e.preventDefault();
    if (pending || !connectionId || codeBlocked) return;
    setPhoneError(null);
    startTransition(async () => {
      const result = await confirmPhoneAction(connectionId, code);
      if ("redirect" in result) {
        router.replace(result.redirect);
        return;
      }
      if (!result.ok) {
        setPhoneError(result.message);
        setCode("");
        return;
      }
      stopPolling();
      setPhoneResult(result.data.status);
    });
  }

  function redeem(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setCodeError(null);
    startTransition(async () => {
      const result = await redeemPatientCodeAction(patientCode);
      if ("redirect" in result) {
        router.replace(result.redirect);
        return;
      }
      if (!result.ok) {
        setCodeError(result.message);
        setPatientCode("");
        return;
      }
      setCodeResult(
        result.data.status === "active"
          ? "Пациент уже подключён к вам."
          : "Запрос отправлен. Доступ откроется после подтверждения пациентом.",
      );
    });
  }

  const sending = connectionId !== null && sendState === "sending";
  const showResend = sendState === "failed" || sendState === "timeout";
  // Отдельная кнопка нового кода после неверного/просроченного кода или лимита попыток.
  const codeDead = phoneError !== null && connectionId !== null && sendState === "sent" && code === "" && canResend;

  function renderPhoneStep() {
    if (phoneResult !== null) {
      return (
        <div className="flex flex-col gap-4">
          <p className="text-base leading-normal text-[#0A0D12]">{phoneResultText(phoneResult)}</p>
          <DialogFooter>
            <Button type="button" onClick={finish} className={PRIMARY}>
              Готово
            </Button>
          </DialogFooter>
        </div>
      );
    }

    if (connectionId === null) {
      return (
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            sendCode();
          }}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="connect-country">Страна</Label>
            <Select value={country} onValueChange={setCountry} disabled={pending}>
              <SelectTrigger id="connect-country" className="h-11 w-full bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONNECT_COUNTRIES.map((c) => (
                  <SelectItem key={c.iso} value={c.iso}>
                    {c.name} +{c.dialCode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="connect-phone">Номер телефона</Label>
            <Input
              id="connect-phone"
              type="tel"
              inputMode="tel"
              autoComplete="off"
              placeholder="701 123 45 67"
              value={phone}
              maxLength={20}
              onChange={(e) => setPhone(e.target.value)}
              aria-invalid={phoneError ? true : undefined}
              className="h-11 bg-white"
            />
            <p className="text-sm text-[#5B6270]">
              Пациенту придёт код в WhatsApp. Попросите его продиктовать код.
            </p>
          </div>
          <FormError message={phoneError} />
          <SubmitButton pending={pending} disabled={phone.trim() === ""}>
            Отправить код
          </SubmitButton>
        </form>
      );
    }

    return (
      <form className="flex flex-col gap-4" onSubmit={confirmCode}>
        <p className="text-sm leading-normal text-[#0A0D12]">
          Код отправлен в WhatsApp на {phoneMasked}. Если сообщений несколько, используйте последнее.
        </p>
        {sending ? (
          <p className="flex items-center gap-2 text-sm text-[#5B6270]" role="status">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Отправляем код…
          </p>
        ) : null}
        {sendState === "failed" ? (
          <FormError message={sendMessage ?? "Не удалось отправить код. Попробуйте ещё раз."} />
        ) : null}
        {sendState === "timeout" ? (
          <FormError message="Не удалось подтвердить отправку, отправьте код ещё раз" />
        ) : null}
        {showResend ? (
          <Button type="button" variant="outline" disabled={pending} onClick={sendCode} className={SECONDARY}>
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
            Отправить ещё раз
          </Button>
        ) : null}
        <div className="flex flex-col items-center gap-2">
          <Label htmlFor="connect-code" className="self-start">
            Код из WhatsApp
          </Label>
          <CodeInput
            id="connect-code"
            length={6}
            value={code}
            onChange={setCode}
            disabled={pending || codeBlocked}
            invalid={phoneError !== null}
            aria-label="Код из WhatsApp"
          />
        </div>
        <FormError message={phoneError} />
        <SubmitButton pending={pending} disabled={code.length !== 6 || codeBlocked}>
          Подтвердить номер
        </SubmitButton>
        {canResend && sendState === "sent" ? (
          <Button type="button" variant="outline" disabled={pending} onClick={sendCode} className={SECONDARY}>
            {codeDead ? "Отправить новый код" : "Отправить код повторно"}
          </Button>
        ) : null}
      </form>
    );
  }

  function renderCodeTab() {
    if (codeResult !== null) {
      return (
        <div className="flex flex-col gap-4">
          <p className="text-base leading-normal text-[#0A0D12]">{codeResult}</p>
          <DialogFooter>
            <Button type="button" onClick={finish} className={PRIMARY}>
              Готово
            </Button>
          </DialogFooter>
        </div>
      );
    }
    return (
      <form className="flex flex-col gap-4" onSubmit={redeem}>
        <p className="text-sm text-[#5B6270]">
          Пациент найдёт код в приложении Teren, на вкладке наблюдения.
        </p>
        <div className="flex justify-center">
          <CodeInput
            length={5}
            value={patientCode}
            onChange={setPatientCode}
            disabled={pending}
            invalid={codeError !== null}
            aria-label="Код из приложения"
          />
        </div>
        <FormError message={codeError} />
        <SubmitButton pending={pending} disabled={patientCode.length !== 5}>
          Подключить
        </SubmitButton>
      </form>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        {variant === "sidebar" ? (
          <button
            type="button"
            className="flex h-16 w-full items-center justify-between rounded-[40px] bg-td-accent pr-3 pl-6 text-left text-sm font-semibold text-td-ink outline-none transition-[filter] hover:brightness-95 focus-visible:ring-2 focus-visible:ring-td-ink focus-visible:ring-offset-2"
          >
            Подключить пациента
            <span aria-hidden className="flex size-[38px] items-center justify-center rounded-full bg-td-ink text-td-accent">
              <Plus className="size-5" />
            </span>
          </button>
        ) : (
          <Button type="button" className={PRIMARY}>
            Подключить
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Подключить пациента</DialogTitle>
          <DialogDescription>Выберите способ подключения.</DialogDescription>
        </DialogHeader>
        <Tabs value={tab} onValueChange={setTab} className="gap-4">
          <TabsList className="w-full">
            <TabsTrigger value="phone">По номеру телефона</TabsTrigger>
            <TabsTrigger value="code">По коду из приложения</TabsTrigger>
          </TabsList>
          <TabsContent value="phone">{renderPhoneStep()}</TabsContent>
          <TabsContent value="code">{renderCodeTab()}</TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
