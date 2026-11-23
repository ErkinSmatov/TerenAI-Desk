import { cn } from "@/lib/utils";

// Баннер ошибки всей формы; размещается над кнопкой отправки.
export function FormError({ message, className }: { message?: string | null; className?: string }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className={cn(
        "rounded-2xl bg-[#FEE2E2] px-4 py-3 text-sm leading-normal font-normal text-[#B42318]",
        className,
      )}
    >
      {message}
    </div>
  );
}
