import { describe, expect, it } from "vitest";
import { ConvexError } from "convex/values";
import { AUTH_MESSAGES, classifyAuthError, mapAuthError } from "./authErrors";

describe("mapAuthError", () => {
  it("неверный пароль и неизвестный аккаунт дают один текст", () => {
    expect(mapAuthError(new Error("Invalid credentials"))).toBe(AUTH_MESSAGES.invalidCredentials);
    expect(mapAuthError(new Error("InvalidAccountId"))).toBe(AUTH_MESSAGES.invalidCredentials);
    expect(mapAuthError(new Error("InvalidSecret"))).toBe(AUTH_MESSAGES.invalidCredentials);
  });

  it("неверный код", () => {
    expect(mapAuthError(new Error("Invalid code"))).toBe(AUTH_MESSAGES.invalidCode);
    expect(mapAuthError(new Error("Could not verify code"))).toBe(AUTH_MESSAGES.invalidCode);
  });

  it("истёкший код", () => {
    expect(mapAuthError(new Error("Code expired"))).toBe(AUTH_MESSAGES.expiredCode);
  });

  it("WEAK_PASSWORD из ConvexError и из текста", () => {
    expect(mapAuthError(new ConvexError("WEAK_PASSWORD"))).toBe(AUTH_MESSAGES.weakPassword);
    expect(mapAuthError(new Error("Uncaught ConvexError: WEAK_PASSWORD"))).toBe(
      AUTH_MESSAGES.weakPassword,
    );
  });

  it("RATE_LIMITED и TooManyFailedAttempts", () => {
    expect(mapAuthError(new ConvexError("RATE_LIMITED"))).toBe(AUTH_MESSAGES.rateLimited);
    expect(mapAuthError(new Error("TooManyFailedAttempts"))).toBe(AUTH_MESSAGES.rateLimited);
  });

  it("всё остальное: общий текст", () => {
    expect(mapAuthError(new Error("Server Error"))).toBe(AUTH_MESSAGES.generic);
    expect(mapAuthError(undefined)).toBe(AUTH_MESSAGES.generic);
    expect(mapAuthError(42)).toBe(AUTH_MESSAGES.generic);
  });

  it("classifyAuthError отличает сеть", () => {
    expect(classifyAuthError(new TypeError("Failed to fetch"))).toBe("network");
    expect(classifyAuthError(new Error("Server Error"))).toBe("other");
  });
});
