import { describe, expect, it } from "vitest";
import { CONNECT_GENERIC, connectMessage, sendErrorMessage } from "./connectErrors";

describe("connectMessage", () => {
  it.each([
    ["invalid_phone", "Проверьте номер: такой номер не подходит для входа в приложение Teren."],
    ["rate_limited", "Слишком много попыток. Повторите позже."],
    ["already_pending", "Этот номер уже подтверждён и ждёт установки приложения."],
    ["code_expired", "Код устарел. Отправьте новый код."],
    ["too_many_attempts", "Слишком много неверных попыток. Отправьте новый код."],
    ["not_found", "Код не найден. Проверьте код в приложении пациента."],
    ["not_accepted", "Запрос не принят. Попробуйте позже."],
  ])("%s", (code, text) => {
    expect(connectMessage(code)).toBe(text);
  });

  it("invalid_code с числом попыток", () => {
    expect(connectMessage("invalid_code", { attemptsLeft: 3 })).toBe(
      "Неверный код. Осталось попыток: 3.",
    );
    expect(connectMessage("invalid_code")).toBe("Неверный код. Осталось попыток: 0.");
  });

  it("code_sending отличается от code_expired", () => {
    expect(connectMessage("code_sending")).toBe(
      "Код ещё отправляется. Дождитесь сообщения в WhatsApp и введите код.",
    );
    expect(connectMessage("code_expired")).toBe("Код устарел. Отправьте новый код.");
  });

  it("неизвестный код даёт общий текст", () => {
    expect(connectMessage("whatever")).toBe(CONNECT_GENERIC);
    expect(connectMessage("constructor")).toBe(CONNECT_GENERIC);
  });
});

describe("sendErrorMessage", () => {
  it("известные ошибки отправки", () => {
    expect(sendErrorMessage("CHANNEL_UNREACHABLE")).toBe(
      "У этого номера нет WhatsApp. Подключите пациента по коду из приложения.",
    );
    expect(sendErrorMessage("INVALID_PHONE")).toBe("Twilio не принял номер. Проверьте его.");
    expect(sendErrorMessage("RATE_LIMITED")).toBe(
      "Слишком много сообщений на этот номер. Повторите позже.",
    );
  });
  it("прочее", () => {
    expect(sendErrorMessage("X")).toBe("Не удалось отправить код. Попробуйте ещё раз.");
    expect(sendErrorMessage(null)).toBe("Не удалось отправить код. Попробуйте ещё раз.");
    expect(connectMessage("send_failed", { sendError: "CHANNEL_UNREACHABLE" })).toContain(
      "нет WhatsApp",
    );
  });
});
