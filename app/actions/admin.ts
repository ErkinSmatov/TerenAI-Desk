"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { api, type ClinicId, type ClinicRole, type DoctorId } from "@/lib/convexApi";
import { callMutation } from "@/lib/convexServer";
import { routeForStage } from "@/lib/stage";

export type AdminActionOutcome =
  | { ok: true; clinicId?: string }
  | { ok: false; message: string }
  | { redirect: string };

const GENERIC = "Не удалось выполнить действие. Проверьте соединение и попробуйте ещё раз.";

const idSchema = z.string().min(1).max(64);
const roleSchema = z.enum(["owner", "doctor", "admin"]);
const nameSchema = z.string().trim().min(1).max(200);

type Result = { ok: boolean; code?: string; clinicId?: string };

function toOutcome(result: Result): AdminActionOutcome {
  if (result.ok) {
    revalidatePath("/admin", "layout");
    return result.clinicId ? { ok: true, clinicId: result.clinicId } : { ok: true };
  }
  switch (result.code) {
    case "clinic_required":
      return { ok: false, message: "Выберите клинику и роль" };
    case "duplicate":
      return { ok: false, message: "Клиника с таким названием уже есть" };
    case "invalid_input":
      return { ok: false, message: "Заполните это поле." };
    case "unauthenticated":
    case "2fa_required":
    case "session_expired":
      return { redirect: routeForStage({ ok: false, code: result.code }) };
    case "not_admin":
      return { redirect: "/" };
    default:
      return { ok: false, message: GENERIC };
  }
}

const INVALID: AdminActionOutcome = { ok: false, message: GENERIC };

export async function createClinicAction(name: string): Promise<AdminActionOutcome> {
  const parsed = nameSchema.safeParse(name);
  if (!parsed.success) return { ok: false, message: "Заполните это поле." };
  return toOutcome(await callMutation(api.admin.createClinic, { name: parsed.data }));
}

export async function linkClinicAction(
  doctorId: string,
  clinicId: string,
): Promise<AdminActionOutcome> {
  const d = idSchema.safeParse(doctorId);
  const c = idSchema.safeParse(clinicId);
  if (!d.success || !c.success) return INVALID;
  return toOutcome(
    await callMutation(api.admin.linkClinic, {
      doctorId: d.data as DoctorId,
      clinicId: c.data as ClinicId,
    }),
  );
}

export async function setRoleAction(doctorId: string, role: string): Promise<AdminActionOutcome> {
  const d = idSchema.safeParse(doctorId);
  const r = roleSchema.safeParse(role);
  if (!d.success || !r.success) return INVALID;
  return toOutcome(
    await callMutation(api.admin.setRole, { doctorId: d.data as DoctorId, role: r.data as ClinicRole }),
  );
}

export async function verifyDoctorAction(doctorId: string): Promise<AdminActionOutcome> {
  const d = idSchema.safeParse(doctorId);
  if (!d.success) return INVALID;
  return toOutcome(await callMutation(api.admin.verifyDoctor, { doctorId: d.data as DoctorId }));
}

export async function rejectDoctorAction(doctorId: string): Promise<AdminActionOutcome> {
  const d = idSchema.safeParse(doctorId);
  if (!d.success) return INVALID;
  return toOutcome(await callMutation(api.admin.rejectDoctor, { doctorId: d.data as DoctorId }));
}

export async function resetTotpAction(doctorId: string): Promise<AdminActionOutcome> {
  const d = idSchema.safeParse(doctorId);
  if (!d.success) return INVALID;
  return toOutcome(await callMutation(api.admin.resetTotp, { doctorId: d.data as DoctorId }));
}
