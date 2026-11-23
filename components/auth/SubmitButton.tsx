import type { ComponentProps } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SubmitButtonProps = Omit<ComponentProps<typeof Button>, "type"> & { pending?: boolean };

// Главная pill-кнопка формы: лайм, высота 44px, на время отправки заблокирована, ширина не меняется.
export function SubmitButton({ pending, children, className, disabled, ...props }: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      disabled={pending || disabled}
      className={cn(
        "h-11 w-full rounded-full bg-[#C9F14C] px-4 text-base font-semibold text-[#0A0D12] hover:bg-[#BDE63F]",
        className,
      )}
      {...props}
    >
      {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
      {children}
    </Button>
  );
}
