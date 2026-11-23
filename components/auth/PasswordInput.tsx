"use client";

import { useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PasswordInputProps = Omit<ComponentProps<"input">, "type"> & {
  showHint?: boolean;
  hintId?: string;
};

export function PasswordInput({
  className,
  showHint = true,
  hintId,
  id,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const resolvedHintId = hintId ?? (id ? `${id}-hint` : undefined);

  return (
    <div className="flex flex-col gap-1">
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          {...props}
          className={cn("h-11 rounded-full bg-white px-4 pr-12", className)}
          aria-describedby={showHint ? resolvedHintId : props["aria-describedby"]}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Скрыть пароль" : "Показать пароль"}
          aria-pressed={visible}
          className="absolute top-0 right-0 flex size-11 items-center justify-center rounded-full text-[#5B6270] outline-none hover:text-[#0A0D12] focus-visible:ring-2 focus-visible:ring-[#0A0D12]"
        >
          {visible ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
        </button>
      </div>
      {showHint ? (
        <p id={resolvedHintId} className="text-sm leading-normal font-normal text-[#5B6270]">
          Минимум 12 символов
        </p>
      ) : null}
    </div>
  );
}
