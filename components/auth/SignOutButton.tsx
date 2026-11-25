"use client";

import { useState, type ComponentProps } from "react";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { recordSignOutAction } from "@/app/actions/auth";

// Порядок важен (Pitfall 9): сначала аудит выхода, затем signOut(), затем переход.
// Остальные props и ref пробрасываются на Button: внутри DropdownMenuItem asChild
// пункт сохраняет role="menuitem" и клавиатурную навигацию Radix (WR-10).
export function SignOutButton({
  className,
  onClick,
  disabled,
  ...props
}: ComponentProps<typeof Button>) {
  const router = useRouter();
  const { signOut } = useAuthActions();
  const [pending, setPending] = useState(false);

  async function handleClick(event: Parameters<NonNullable<typeof onClick>>[0]) {
    onClick?.(event);
    if (pending) return;
    setPending(true);
    try {
      try {
        await recordSignOutAction();
      } catch {
        // Аудит не должен блокировать выход.
      }
      await signOut();
      router.replace("/sign-in");
    } catch {
      toast.error("Не удалось выйти. Попробуйте ещё раз.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      {...props}
      onClick={handleClick}
      disabled={pending || disabled}
      className={className ?? "h-11 rounded-full bg-white px-5 text-sm font-semibold"}
    >
      {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
      Выйти
    </Button>
  );
}
