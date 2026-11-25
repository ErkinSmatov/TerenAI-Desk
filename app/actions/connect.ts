"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { api, type PhoneConnectionId } from "@/lib/convexApi";
import { callMutation, callQuery } from "@/lib/convexServer";
import { CONNECT_GENERIC, connectMessage, sendErrorMessage } from "@/lib/connectErrors";
import { routeForStage } from "@/lib/stage";
import {
  MSG,
  connectCodeSchema,
  connectPhoneSchema,
  patientCodeSchema,
} from "@/lib/validation";

export type ConnectOutcome<T> =
  | { ok: true; data: T }
  | { ok: false; message: string; attemptsLeft?: number }
  | { redirect: string };

const idSchema = z.string().min(1).max(64);

type Failure = { ok: false; code: string; attemptsLeft?: number };
type AnyResult = { ok: true } | Failure;

// Отказы шлюза -> страница входа или кабинет; прочие коды -> русский текст.
// Номер врача в ответ не возвращается и не логируется: наружу идёт только phoneMasked с сервера.
function toFailure(result: Failure): ConnectOutcome<never> {
  switch (result.code) {
    case "unauthenticated":
    case "2fa_required":
    case "session_expired":
      return { redirect: routeForStage({ ok: false, code: result.code }) };
    case "not_verified":
    case "not_doctor_account":
    case "no_doctor_profile":
    case "no_clinic":
      return { redirect: "/" };
    default:
      return {
        ok: false,
        message: connectMessage(result.code, { attemptsLeft: result.attemptsLeft }),
        ...(result.attemptsLeft === undefined ? {} : { attemptsLeft: result.attemptsLeft }),
      };
  }
}

function toConnectOutcome<R extends AnyResult, T>(
  result: R,
  pick: (ok: Extract<R, { ok: true }>) => T,
  revalidate: boolean,
): ConnectOutcome<T> {
  if (result.ok) {
    if (revalidate) revalidatePath("/patients");
    return { ok: true, data: pick(result as Extract<R, { ok: true }>) };
  }
  return toFailure(result as Failure);
}

const GENERIC_OUTCOME: ConnectOutcome<never> = { ok: false, message: CONNECT_GENERIC };

export async function startPhoneAction(
  country: string,
  phone: string,
): Promise<ConnectOutcome<{ connectionId: string; phoneMasked: string }>> {
  const parsed = connectPhoneSchema.safeParse({ country, phone });
  if (!parsed.success) return { ok: false, message: MSG.phone };
  const result = await callMutation(api.connect.startPhone, parsed.data);
  return toConnectOutcome(
    result,
    (r) => ({ connectionId: r.connectionId, phoneMasked: r.phoneMasked }),
    true,
  );
}

export type ConnectionState = {
  sendState: "sending" | "sent" | "failed";
  sendError: string | null;
  status: "awaiting_code" | "awaiting_install" | "awaiting_patient" | "expired";
  attemptsLeft: number;
  phoneMasked: string;
  message?: string;
};

export async function getConnectionStateAction(
  connectionId: string,
): Promise<ConnectOutcome<ConnectionState>> {
  const id = idSchema.safeParse(connectionId);
  if (!id.success) return GENERIC_OUTCOME;
  const result = await callQuery(api.connect.getConnection, {
    connectionId: id.data as PhoneConnectionId,
  });
  return toConnectOutcome(
    result,
    (r) => ({
      sendState: r.sendState,
      sendError: r.sendError,
      status: r.status,
      attemptsLeft: r.attemptsLeft,
      phoneMasked: r.phoneMasked,
      ...(r.sendState === "failed" ? { message: sendErrorMessage(r.sendError) } : {}),
    }),
    false,
  );
}

export async function confirmPhoneAction(
  connectionId: string,
  code: string,
): Promise<ConnectOutcome<{ status: string }>> {
  const id = idSchema.safeParse(connectionId);
  const c = connectCodeSchema.safeParse(code);
  if (!id.success) return GENERIC_OUTCOME;
  if (!c.success) return { ok: false, message: MSG.connectCode };
  const result = await callMutation(api.connect.confirmPhone, {
    connectionId: id.data as PhoneConnectionId,
    code: c.data,
  });
  return toConnectOutcome(result, (r) => ({ status: r.status }), true);
}

export async function redeemPatientCodeAction(
  code: string,
): Promise<ConnectOutcome<{ status: string }>> {
  const c = patientCodeSchema.safeParse(code);
  if (!c.success) return { ok: false, message: MSG.patientCode };
  const result = await callMutation(api.connect.redeemPatientCode, { code: c.data });
  return toConnectOutcome(result, (r) => ({ status: r.status }), true);
}

export async function cancelConnectionAction(
  connectionId: string,
): Promise<ConnectOutcome<Record<string, never>>> {
  const id = idSchema.safeParse(connectionId);
  if (!id.success) return GENERIC_OUTCOME;
  const result = await callMutation(api.connect.cancel, {
    connectionId: id.data as PhoneConnectionId,
  });
  return toConnectOutcome(result, () => ({}), true);
}
