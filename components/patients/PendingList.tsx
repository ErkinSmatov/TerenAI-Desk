"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { cancelConnectionAction } from "@/app/actions/connect";
import type { PendingConnectionRow } from "@/lib/convexApi";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
const DESTRUCTIVE =
  "h-11 rounded-full border-[#B42318] bg-white px-5 font-semibold text-[#B42318] hover:bg-[#FEF3F2]";

const dateFormat = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" });

const STATUS_LABEL: Record<PendingConnectionRow["status"], string> = {
  awaiting_install: "Ждёт установки",
  awaiting_patient: "Ждёт подтверждения пациентом",
  expired: "Истекло",
};

const STATUS_CLASS: Record<PendingConnectionRow["status"], string> = {
  awaiting_install: "bg-td-badge text-td-ink",
  awaiting_patient: "bg-td-accent text-td-ink",
  expired: "bg-td-bg text-[#B42318] shadow-[inset_0_0_12px_rgba(228,0,5,0.25)]",
};

export function PendingList({ connections }: { connections: PendingConnectionRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function cancel(connectionId: string) {
    startTransition(async () => {
      const result = await cancelConnectionAction(connectionId);
      if ("redirect" in result) {
        router.replace(result.redirect);
        return;
      }
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success("Подключение отменено");
      router.refresh();
    });
  }

  if (connections.length === 0) {
    return (
      <div className="rounded-[24px] bg-td-tile p-6 text-td-ink">
        <h3 className="text-base font-semibold">Нет ожидающих подтверждения</h3>
        <p className="mt-2 max-w-xl text-sm text-td-ink-2">
          Подключения, которых вы ждёте, появятся здесь. Подтвердившие пациенты переходят на
          «Главную». Подключить пациента можно кнопкой «Подключить пациента».
        </p>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
      {connections.map((c) => {
        const expired = c.status === "expired";
        const date = dateFormat.format(new Date(c.expiresAt));
        return (
          <li
            key={c.connectionId}
            className="flex flex-col gap-4 rounded-[24px] bg-td-tile p-5 text-td-ink"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="td-num text-xl font-medium tabular-nums">{c.phoneMasked}</span>
              <span
                className={`inline-flex shrink-0 rounded-[12px] px-3 py-1 text-xs font-semibold ${STATUS_CLASS[c.status]}`}
              >
                {STATUS_LABEL[c.status]}
              </span>
            </div>
            <div className="flex items-end justify-between gap-3">
              <div className="flex flex-col gap-1 text-xs text-td-ink-2">
                <span>{expired ? `Удалится ${date}` : `Действует до ${date}`}</span>
                {expired ? <span>Подключите заново</span> : null}
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="outline" disabled={pending} className={DESTRUCTIVE}>
                    {expired ? "Убрать" : "Отменить"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Отменить подключение?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Пациент не получит запрос, номер будет удалён.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Назад</AlertDialogCancel>
                    <AlertDialogAction onClick={() => cancel(c.connectionId)}>
                      {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
                      Отменить подключение
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
