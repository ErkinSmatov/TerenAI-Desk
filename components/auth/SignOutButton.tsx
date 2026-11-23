"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { recordSignOutAction } from "@/app/actions/auth";

// Порядок важен (Pitfall 9): сначала аудит выхода, затем signOut(), затем переход.
export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  const { signOut } = useAuthActions();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (pending) return;
    setPending(true);
    try {
      await recordSignOutAction();
    } catch {
      // Аудит не должен блокировать выход.
    }
    try {
      await signOut();
    } finally {
      router.replace("/sign-in");
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleClick}
      disabled={pending}
      className={className ?? "h-11 rounded-full bg-white px-5 text-sm font-semibold"}
    >
      {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
      Выйти
    </Button>
  );
}
