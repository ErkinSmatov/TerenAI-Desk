"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { createClinicAction } from "@/app/actions/admin";
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

// Используется на странице клиник и в карточке врача (onCreated выбирает новую клинику).
export function CreateClinicDialog({
  onCreated,
  triggerClassName,
}: {
  onCreated?: (clinicId: string, name: string) => void;
  triggerClassName?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    startTransition(async () => {
      const result = await createClinicAction(name);
      if ("redirect" in result) {
        router.replace(result.redirect);
        return;
      }
      if (!result.ok) {
        setError(result.message);
        toast.error(result.message);
        return;
      }
      toast.success("Клиника создана");
      const created = name.trim();
      setOpen(false);
      setName("");
      setError(null);
      if (result.clinicId) onCreated?.(result.clinicId, created);
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError(null);
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          className={triggerClassName ?? "h-11 rounded-full bg-[#C9F14C] px-5 font-semibold text-[#0A0D12] hover:bg-[#BDE63F]"}
        >
          Создать клинику
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Создать клинику</DialogTitle>
            <DialogDescription>Клинику можно будет привязать к врачам.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="clinic-name">Название клиники</Label>
            <Input
              id="clinic-name"
              value={name}
              maxLength={200}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={error ? true : undefined}
              autoComplete="off"
            />
            {error ? (
              <p role="alert" className="text-sm text-[#B42318]">
                {error}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending} className="h-11 rounded-full bg-[#C9F14C] px-5 font-semibold text-[#0A0D12] hover:bg-[#BDE63F]">
              {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
              Создать клинику
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
