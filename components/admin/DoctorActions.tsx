"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  linkClinicAction,
  rejectDoctorAction,
  resetTotpAction,
  setRoleAction,
  verifyDoctorAction,
  type AdminActionOutcome,
} from "@/app/actions/admin";
import type { ClinicRole, DoctorStatus } from "@/lib/convexApi";
import { clinicRoleLabel } from "@/lib/labels";
import { CreateClinicDialog } from "@/components/admin/CreateClinicDialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ROLES: ClinicRole[] = ["owner", "doctor", "admin"];
const DESTRUCTIVE =
  "h-11 rounded-full border-[#B42318] bg-white px-5 font-semibold text-[#B42318] hover:bg-[#FEF3F2]";

type ClinicOption = { clinicId: string; name: string };

export function DoctorActions({
  doctorId,
  fullName,
  status,
  clinicId,
  clinicRole,
  clinics,
}: {
  doctorId: string;
  fullName: string;
  status: DoctorStatus;
  clinicId: string | null;
  clinicRole: ClinicRole | null;
  clinics: ClinicOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [clinic, setClinic] = useState<string>(clinicId ?? "");
  const [role, setRole] = useState<ClinicRole | "">(clinicRole ?? "");
  const [extra, setExtra] = useState<ClinicOption[]>([]);

  const options = [...clinics, ...extra.filter((e) => !clinics.some((c) => c.clinicId === e.clinicId))];
  const canVerify = clinic !== "" && role !== "";

  function run(action: () => Promise<AdminActionOutcome>, success: string, onOk?: () => void) {
    startTransition(async () => {
      const result = await action();
      if ("redirect" in result) {
        router.replace(result.redirect);
        return;
      }
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(success);
      onOk?.();
      router.refresh();
    });
  }

  function changeClinic(next: string) {
    setClinic(next);
    run(() => linkClinicAction(doctorId, next), "Клиника привязана");
  }

  function changeRole(next: string) {
    setRole(next as ClinicRole);
    run(() => setRoleAction(doctorId, next), "Роль сохранена");
  }

  return (
    <div className="flex flex-col gap-6 rounded-2xl bg-[#F4F5F7] p-6">
      <h2 className="text-xl leading-[1.2] font-semibold">Привязка к клинике</h2>

      <div className="flex flex-col gap-2">
        <Label htmlFor="doctor-clinic">Клиника</Label>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={clinic} onValueChange={changeClinic} disabled={pending}>
            <SelectTrigger id="doctor-clinic" className="h-11 w-full max-w-sm bg-white">
              <SelectValue placeholder="Выберите клинику" />
            </SelectTrigger>
            <SelectContent>
              {options.map((c) => (
                <SelectItem key={c.clinicId} value={c.clinicId}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <CreateClinicDialog
            triggerClassName="h-11 rounded-full bg-white px-5 font-semibold text-[#0A0D12] border border-[#E5E7EB] hover:bg-[#F4F5F7]"
            onCreated={(id, name) => {
              setExtra((prev) => [...prev, { clinicId: id, name }]);
              changeClinic(id);
            }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="doctor-role">Роль</Label>
        <Select value={role} onValueChange={changeRole} disabled={pending}>
          <SelectTrigger id="doctor-role" className="h-11 w-full max-w-sm bg-white">
            <SelectValue placeholder="Выберите роль" />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {clinicRoleLabel(r)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          disabled={!canVerify || pending}
          onClick={() => run(() => verifyDoctorAction(doctorId), "Врач подтверждён")}
          className="h-11 rounded-full bg-[#C9F14C] px-5 font-semibold text-[#0A0D12] hover:bg-[#BDE63F]"
        >
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
          Подтвердить врача
        </Button>
        {!canVerify ? <span className="text-sm text-[#5B6270]">Выберите клинику и роль</span> : null}

        {status !== "rejected" ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="outline" disabled={pending} className={DESTRUCTIVE}>
                Отклонить
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Отклонить заявку врача {fullName}?</AlertDialogTitle>
                <AlertDialogDescription>
                  Врач увидит, что заявка отклонена. Действие можно изменить позже подтверждением.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Отмена</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => run(() => rejectDoctorAction(doctorId), "Заявка отклонена")}
                >
                  Отклонить заявку
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : null}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="outline" disabled={pending} className={DESTRUCTIVE}>
              Сбросить 2FA
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Сбросить 2FA для {fullName}?</AlertDialogTitle>
              <AlertDialogDescription>
                Делайте это только после проверки личности врача. При следующем входе врач
                настроит код заново.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => run(() => resetTotpAction(doctorId), "Второй фактор сброшен")}
              >
                Сбросить 2FA
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
