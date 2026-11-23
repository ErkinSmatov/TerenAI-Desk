// Карта ошибок Convex Auth и кодов сервера -> тексты Copywriting Contract (UI-SPEC).
// Не различает «нет аккаунта» и «неверный пароль» (защита от перечисления email).

export const AUTH_MESSAGES = {
  invalidCredentials:
    "Неверный email или пароль. Проверьте данные и попробуйте снова или восстановите пароль.",
  invalidCode: "Неверный код. Проверьте письмо или запросите новый код.",
  expiredCode: "Срок действия кода истёк. Нажмите «Отправить код ещё раз».",
  weakPassword: "Пароль должен содержать не менее 12 символов.",
  rateLimited: "Слишком много запросов. Подождите минуту и попробуйте снова.",
  generic: "Не удалось выполнить действие. Проверьте соединение и попробуйте ещё раз.",
  sessionExpired: "Сессия закончилась. Войдите снова.",
} as const;

export type AuthErrorKind =
  | "invalid_credentials"
  | "invalid_code"
  | "expired_code"
  | "weak_password"
  | "rate_limited"
  | "network"
  | "other";

// Текст ошибки плюс данные ConvexError (data), если есть.
function errorText(error: unknown): string {
  if (error === null || error === undefined) return "";
  if (typeof error === "string") return error;
  const parts: string[] = [];
  if (typeof error === "object") {
    const e = error as { message?: unknown; data?: unknown };
    if (typeof e.message === "string") parts.push(e.message);
    if (typeof e.data === "string") parts.push(e.data);
    else if (e.data && typeof e.data === "object") {
      const d = e.data as { code?: unknown; message?: unknown };
      if (typeof d.code === "string") parts.push(d.code);
      if (typeof d.message === "string") parts.push(d.message);
    }
  }
  return parts.join(" ");
}

export function classifyAuthError(error: unknown): AuthErrorKind {
  const text = errorText(error);
  if (/RATE_LIMITED|TooManyFailedAttempts|too many/i.test(text)) return "rate_limited";
  if (/WEAK_PASSWORD|Invalid password/i.test(text)) return "weak_password";
  if (/expired/i.test(text)) return "expired_code";
  if (/Invalid code|Could not verify code|InvalidCode/i.test(text)) return "invalid_code";
  if (/Invalid credentials|InvalidAccountId|InvalidSecret/i.test(text)) return "invalid_credentials";
  if (
    error instanceof TypeError ||
    /Failed to fetch|NetworkError|network|Load failed|ECONN|timeout/i.test(text)
  ) {
    return "network";
  }
  return "other";
}

export function mapAuthError(error: unknown): string {
  switch (classifyAuthError(error)) {
    case "invalid_credentials":
      return AUTH_MESSAGES.invalidCredentials;
    case "invalid_code":
      return AUTH_MESSAGES.invalidCode;
    case "expired_code":
      return AUTH_MESSAGES.expiredCode;
    case "weak_password":
      return AUTH_MESSAGES.weakPassword;
    case "rate_limited":
      return AUTH_MESSAGES.rateLimited;
    default:
      return AUTH_MESSAGES.generic;
  }
}
