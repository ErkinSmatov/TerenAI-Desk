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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const DESTRUCTIVE =
  "h-11 rounded-full border-[#B42318] bg-white px-5 font-semibold text-[#B42318] hover:bg-[#FEF3F2]";

const dateFormat = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" });

const STATUS_LABEL: Record<PendingConnectionRow["status"], string> = {
  awaiting_install: "Ждёт установки",
  awaiting_patient: "Ждёт подтверждения пациентом",
  expired: "Истекло",
};

const STATUS_CLASS: Record<PendingConnectionRow["status"], string> = {
  awaiting_install: "bg-[#F4F5F7] text-[#0A0D12]",
  awaiting_patient: "bg-[#EEF9C9] text-[#0A0D12]",
  expired: "bg-[#FEE2E2] text-[#B42318]",
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

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Номер</TableHead>
          <TableHead>Статус</TableHead>
          <TableHead>Срок</TableHead>
          <TableHead className="text-right">
            <span className="sr-only">Действия</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {connections.map((c) => {
          const expired = c.status === "expired";
          const date = dateFormat.format(new Date(c.expiresAt));
          return (
            <TableRow key={c.connectionId} className="h-14">
              <TableCell className="font-semibold tabular-nums">{c.phoneMasked}</TableCell>
              <TableCell>
                <div className="flex flex-col items-start gap-1">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${STATUS_CLASS[c.status]}`}
                  >
                    {STATUS_LABEL[c.status]}
                  </span>
                  {expired ? <span className="text-xs text-[#5B6270]">Подключите заново</span> : null}
                </div>
              </TableCell>
              <TableCell className="text-[#5B6270]">
                {expired ? `удалится ${date}` : `до ${date}`}
              </TableCell>
              <TableCell className="text-right">
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
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
