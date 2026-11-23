import { describe, expect, it } from "vitest";
import {
  emailCodeSchema,
  emailSchema,
  passwordSchema,
  profileSchema,
  resetConfirmSchema,
  signUpSchema,
  totpCodeSchema,
} from "./validation";

function firstMessage(r: { success: boolean; error?: { issues: { message: string }[] } }) {
  return r.error?.issues[0]?.message;
}

describe("emailSchema", () => {
  it("нормализует регистр и пробелы", () => {
    expect(emailSchema.parse("  Doc@Example.COM ")).toBe("doc@example.com");
  });
  it("отклоняет не-email", () => {
    expect(emailSchema.safeParse("abc").success).toBe(false);
  });
});

describe("passwordSchema", () => {
  it("отклоняет 11 символов", () => {
    const r = passwordSchema.safeParse("a".repeat(11));
    expect(r.success).toBe(false);
    expect(firstMessage(r)).toBe("Пароль должен содержать не менее 12 символов.");
  });
  it("принимает 12 и отклоняет 129", () => {
    expect(passwordSchema.safeParse("a".repeat(12)).success).toBe(true);
    expect(passwordSchema.safeParse("a".repeat(129)).success).toBe(false);
  });
});

describe("коды", () => {
  it("email-код ровно 8 цифр", () => {
    expect(emailCodeSchema.safeParse("12345678").success).toBe(true);
    expect(emailCodeSchema.safeParse("1234567").success).toBe(false);
    expect(emailCodeSchema.safeParse("123456789").success).toBe(false);
    expect(emailCodeSchema.safeParse("1234567a").success).toBe(false);
  });
  it("TOTP ровно 6 цифр", () => {
    expect(totpCodeSchema.safeParse("123456").success).toBe(true);
    expect(totpCodeSchema.safeParse("12345").success).toBe(false);
    expect(totpCodeSchema.safeParse("12345a").success).toBe(false);
  });
});

describe("profileSchema", () => {
  const ok = {
    fullName: "Иванов Иван",
    requestedClinic: "Клиника",
    specialty: "Терапевт",
    phone: "+7 700 000 00 00",
  };
  it("принимает корректные данные", () => {
    expect(profileSchema.safeParse(ok).success).toBe(true);
  });
  it("пустое поле", () => {
    const r = profileSchema.safeParse({ ...ok, fullName: "   " });
    expect(r.success).toBe(false);
    expect(firstMessage(r)).toBe("Заполните это поле.");
  });
  it("плохой телефон", () => {
    const r = profileSchema.safeParse({ ...ok, phone: "123" });
    expect(r.success).toBe(false);
    expect(firstMessage(r)).toBe("Введите номер в формате +7 700 000 00 00.");
  });
});

describe("signUpSchema", () => {
  it("несовпадение паролей", () => {
    const r = signUpSchema.safeParse({
      email: "a@b.kz",
      password: "a".repeat(12),
      passwordConfirm: "b".repeat(12),
    });
    expect(r.success).toBe(false);
    expect(firstMessage(r)).toBe("Пароли не совпадают. Введите одинаковый пароль в оба поля.");
  });
  it("совпадающие пароли проходят", () => {
    expect(
      signUpSchema.safeParse({
        email: "a@b.kz",
        password: "a".repeat(12),
        passwordConfirm: "a".repeat(12),
      }).success,
    ).toBe(true);
  });
});

describe("resetConfirmSchema", () => {
  it("проверяет код и пароль", () => {
    expect(
      resetConfirmSchema.safeParse({ email: "a@b.kz", code: "12345678", newPassword: "a".repeat(12) })
        .success,
    ).toBe(true);
    expect(
      resetConfirmSchema.safeParse({ email: "a@b.kz", code: "1", newPassword: "a".repeat(12) }).success,
    ).toBe(false);
  });
});
