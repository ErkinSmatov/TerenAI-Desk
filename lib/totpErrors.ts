// Карта результатов TOTP -> тексты Copywriting Contract (UI-SPEC) или редирект.

export const TOTP_MESSAGES = {
  invalidCode: "Неверный код. Откройте приложение и введите актуальный 6-значный код.",
  notEnrolled: "Второй фактор ещё не настроен. Обновите страницу и начните настройку заново.",
  generic: "Не удалось выполнить действие. Проверьте соединение и попробуйте ещё раз.",
} as const;

// 125000 -> "02:05"
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const mm = Math.floor(total / 60);
  const ss = total % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

export function lockedMessage(ms: number): string {
  return `Слишком много попыток. Повторите через ${formatCountdown(ms)}. Если потеряли доступ к приложению, обратитесь в поддержку Teren.`;
}

export type TotpMapped =
  | { message: string; retryAfterMs?: number }
  | { redirect: string };

type FailLike = { ok: false; code: string; retryAfterMs?: number };

export function mapTotpResult(result: FailLike): TotpMapped {
  switch (result.code) {
    case "invalid_code":
      return { message: TOTP_MESSAGES.invalidCode };
    case "locked": {
      const ms = result.retryAfterMs ?? 0;
      return { message: lockedMessage(ms), retryAfterMs: ms };
    }
    case "session_expired":
      return { redirect: "/sign-in?expired=1" };
    case "2fa_required":
      return { redirect: "/totp" };
    case "unauthenticated":
    case "not_doctor_account":
      return { redirect: "/sign-in" };
    case "profile_required":
    case "no_doctor_profile":
      return { redirect: "/register/profile" };
    case "not_enrolled":
      return { redirect: "/totp-setup" };
    default:
      return { message: TOTP_MESSAGES.generic };
  }
}
