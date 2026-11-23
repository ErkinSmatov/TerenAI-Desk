"use server";

import { api } from "@/lib/convexApi";
import { callMutation } from "@/lib/convexServer";
import { getStage, routeForStage } from "@/lib/stage";

// После успешного входа по паролю: аудит начала сессии и маршрут по стадии.
export async function afterPasswordSignIn(): Promise<{ redirectTo: string }> {
  await callMutation(api.doctor.recordSessionStart, {});
  const stage = await getStage();
  return { redirectTo: routeForStage(stage) };
}

// Аудит выхода выполняется ДО signOut() на клиенте (Pitfall 9).
export async function recordSignOutAction(): Promise<{ ok: boolean }> {
  const result = await callMutation(api.doctor.recordSignOut, {});
  return { ok: result.ok };
}
