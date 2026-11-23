import { describe, expect, it } from "vitest";
import { formatCountdown, mapTotpResult } from "./totpErrors";

describe("formatCountdown", () => {
  it("форматирует MM:SS", () => {
    expect(formatCountdown(125000)).toBe("02:05");
    expect(formatCountdown(0)).toBe("00:00");
    expect(formatCountdown(-5)).toBe("00:00");
  });
});

describe("mapTotpResult", () => {
  it("invalid_code", () => {
    expect(mapTotpResult({ ok: false, code: "invalid_code" })).toEqual({
      message: "Неверный код. Откройте приложение и введите актуальный 6-значный код.",
    });
  });
  it("locked с отсчётом", () => {
    expect(mapTotpResult({ ok: false, code: "locked", retryAfterMs: 61000 })).toEqual({
      message:
        "Слишком много попыток. Повторите через 01:01. Если потеряли доступ к приложению, обратитесь в поддержку Teren.",
      retryAfterMs: 61000,
    });
  });
  it("редиректы", () => {
    expect(mapTotpResult({ ok: false, code: "session_expired" })).toEqual({ redirect: "/sign-in?expired=1" });
    expect(mapTotpResult({ ok: false, code: "unauthenticated" })).toEqual({ redirect: "/sign-in" });
    expect(mapTotpResult({ ok: false, code: "2fa_required" })).toEqual({ redirect: "/totp" });
  });
});
