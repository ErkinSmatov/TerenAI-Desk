"use server";

import { api, type ProfileField } from "@/lib/convexApi";
import { callMutation } from "@/lib/convexServer";
import { getStage, routeForStage } from "@/lib/stage";
import { MSG, profileSchema } from "@/lib/validation";

export type SubmitProfileResult =
  | { redirectTo: string }
  | { fieldErrors: Partial<Record<ProfileField, string>> }
  | { error: string };

const GENERIC = "Не удалось отправить заявку. Проверьте соединение и попробуйте ещё раз.";

// Шаг 3 регистрации: данные врача -> заявка в статусе pending (D-04).
export async function submitProfile(input: unknown): Promise<SubmitProfileResult> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Partial<Record<ProfileField, string>> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as ProfileField | undefined;
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }
  const result = await callMutation(api.doctor.completeRegistration, parsed.data);
  if (result.ok) return { redirectTo: routeForStage(await getStage()) };
  if (result.code === "invalid_input" && "field" in result) {
    return { fieldErrors: { [result.field]: result.field === "phone" ? MSG.phone : MSG.required } };
  }
  if (result.code === "already_registered" || result.code === "admin_account") {
    return { redirectTo: routeForStage(await getStage()) };
  }
  if (
    result.code === "unauthenticated" ||
    result.code === "session_expired" ||
    result.code === "not_doctor_account"
  ) {
    return { redirectTo: "/sign-in?expired=1" };
  }
  return { error: GENERIC };
}
