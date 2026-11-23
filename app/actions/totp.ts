"use server";

import { api } from "@/lib/convexApi";
import { callMutation } from "@/lib/convexServer";
import { getStage, routeForStage } from "@/lib/stage";
import { mapTotpResult, TOTP_MESSAGES } from "@/lib/totpErrors";
import { MSG, totpCodeSchema } from "@/lib/validation";

export type EnrollmentResult =
  | { uri: string; secretBase32: string }
  | { redirectTo: string }
  | { error: string };

export type CodeActionResult =
  | { redirectTo: string }
  | { error: string; retryAfterMs?: number };

// URI и ключ возвращаются клиенту только в ответе: не логируются, не пишутся в cookies.
export async function startTotpEnrollment(): Promise<EnrollmentResult> {
  const result = await callMutation(api.doctor.beginTotpEnrollment, {});
  if (result.ok && "uri" in result) {
    return { uri: result.uri, secretBase32: result.secretBase32 };
  }
  if (result.ok) return { error: TOTP_MESSAGES.generic };
  if (result.code === "already_enrolled") return { redirectTo: "/totp" };
  if (result.code === "profile_required") return { redirectTo: "/register/profile" };
  const mapped = mapTotpResult(result);
  return "redirect" in mapped ? { redirectTo: mapped.redirect } : { error: mapped.message };
}

async function handleCode(
  code: string,
  ref: typeof api.doctor.confirmTotpEnrollment | typeof api.doctor.verifyTotp,
): Promise<CodeActionResult> {
  const parsed = totpCodeSchema.safeParse(code);
  if (!parsed.success) return { error: MSG.totpCode };
  const result = await callMutation(ref, { code: parsed.data });
  if (result.ok) return { redirectTo: routeForStage(await getStage()) };
  const mapped = mapTotpResult(result);
  if ("redirect" in mapped) return { redirectTo: mapped.redirect };
  return { error: mapped.message, retryAfterMs: mapped.retryAfterMs };
}

export async function confirmTotpAction(code: string): Promise<CodeActionResult> {
  return handleCode(code, api.doctor.confirmTotpEnrollment);
}

export async function verifyTotpAction(code: string): Promise<CodeActionResult> {
  return handleCode(code, api.doctor.verifyTotp);
}
