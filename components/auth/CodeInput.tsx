"use client";

import { REGEXP_ONLY_DIGITS } from "input-otp";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp";

type CodeInputProps = {
  length: 5 | 6 | 8;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  id?: string;
  "aria-describedby"?: string;
  "aria-label"?: string;
};

const SLOT_CLASS =
  "size-11 bg-white text-xl leading-none font-semibold tabular-nums";

// Поле кода: цифры, автофокус, вставка полного кода, Enter отправляет форму (нативно).
export function CodeInput({
  length,
  value,
  onChange,
  disabled,
  invalid,
  id,
  "aria-describedby": describedBy,
  "aria-label": ariaLabel,
}: CodeInputProps) {
  const half = length / 2;
  const odd = length % 2 !== 0;
  return (
    <InputOTP
      id={id}
      maxLength={length}
      value={value}
      onChange={onChange}
      disabled={disabled}
      pattern={REGEXP_ONLY_DIGITS}
      inputMode="numeric"
      autoComplete="one-time-code"
      autoFocus
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      aria-label={ariaLabel ?? "Код"}
      containerClassName="justify-center gap-2"
    >
      {odd ? (
        <InputOTPGroup>
          {Array.from({ length }, (_, i) => (
            <InputOTPSlot key={i} index={i} className={SLOT_CLASS} aria-invalid={invalid || undefined} />
          ))}
        </InputOTPGroup>
      ) : (
        <>
          <InputOTPGroup>
            {Array.from({ length: half }, (_, i) => (
              <InputOTPSlot key={i} index={i} className={SLOT_CLASS} aria-invalid={invalid || undefined} />
            ))}
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            {Array.from({ length: half }, (_, i) => (
              <InputOTPSlot
                key={half + i}
                index={half + i}
                className={SLOT_CLASS}
                aria-invalid={invalid || undefined}
              />
            ))}
          </InputOTPGroup>
        </>
      )}
    </InputOTP>
  );
}
