// Карта кодов ответов подключения пациента -> тексты для врача (Фаза 81).
// Коды из приложения пациента нейтральны: не раскрывают, что за ними стоит.

export const CONNECT_GENERIC =
  "Не удалось выполнить действие. Проверьте соединение и попробуйте ещё раз.";

const SEND_FALLBACK = "Не удалось отправить код. Попробуйте ещё раз.";

const SEND_ERRORS: Record<string, string> = {
  CHANNEL_UNREACHABLE:
    "У этого номера нет WhatsApp. Подключите пациента по коду из приложения.",
  INVALID_PHONE: "Twilio не принял номер. Проверьте его.",
  RATE_LIMITED: "Слишком много сообщений на этот номер. Повторите позже.",
};

export function sendErrorMessage(sendError: string | null | undefined): string {
  if (sendError && Object.hasOwn(SEND_ERRORS, sendError)) return SEND_ERRORS[sendError];
  return SEND_FALLBACK;
}

export function connectMessage(
  code: string,
  extra?: { attemptsLeft?: number; sendError?: string | null },
): string {
  switch (code) {
    case "invalid_phone":
      return "Проверьте номер: такой номер не подходит для входа в приложение Teren.";
    case "rate_limited":
      return "Слишком много попыток. Повторите позже.";
    case "already_pending":
      return "Этот номер уже подтверждён и ждёт установки приложения.";
    case "invalid_code":
      return `Неверный код. Осталось попыток: ${extra?.attemptsLeft ?? 0}.`;
    case "code_expired":
      return "Код устарел. Отправьте новый код.";
    case "code_sending":
      return "Код ещё отправляется. Дождитесь сообщения в WhatsApp и введите код.";
    case "too_many_attempts":
      return "Слишком много неверных попыток. Отправьте новый код.";
    case "not_found":
      return "Код не найден. Проверьте код в приложении пациента.";
    case "not_accepted":
      return "Запрос не принят. Попробуйте позже.";
    case "send_failed":
      return sendErrorMessage(extra?.sendError);
    default:
      return CONNECT_GENERIC;
  }
}
