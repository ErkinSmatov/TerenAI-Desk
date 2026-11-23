import "server-only";
import { api, type GetMyStageResult } from "./convexApi";

// Чистая функция: результат getMyStage -> маршрут (D-05, D-07).
export function routeForStage(result: GetMyStageResult): string {
  if (!result.ok) {
    switch (result.code) {
      case "session_expired":
        return "/sign-in?expired=1";
      case "not_doctor_account":
        return "/sign-in?error=account";
      case "no_doctor_profile":
        return "/register/profile";
      case "2fa_required":
        return "/totp";
      default:
        return "/sign-in";
    }
  }
  switch (result.stage) {
    case "needs_profile":
      return "/register/profile";
    case "needs_totp_setup":
      return "/totp-setup";
    case "needs_totp":
      return "/totp";
    case "session_expired":
      return "/sign-in?expired=1";
    case "ready":
      return result.isPlatformAdmin ? "/admin" : "/";
  }
}

// Серверный запрос стадии. Побочных эффектов нет: мутации из рендера страниц не вызываются
// (RESEARCH Pattern 5: побочные эффекты только в Server Actions).
export async function getStage(): Promise<GetMyStageResult> {
  const { callQuery } = await import("./convexServer");
  return callQuery(api.doctor.getMyStage, {});
}
