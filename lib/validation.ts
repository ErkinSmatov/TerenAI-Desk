// zod-схемы форм TerenDesk. Тексты ошибок — из Copywriting Contract (UI-SPEC).
import { z } from "zod";

export const MSG = {
  required: "Заполните это поле.",
  email: "Введите корректный email.",
  passwordShort: "Пароль должен содержать не менее 12 символов.",
  passwordLong: "Пароль не должен быть длиннее 128 символов.",
  passwordMismatch: "Пароли не совпадают. Введите одинаковый пароль в оба поля.",
  emailCode: "Введите 8-значный код из письма.",
  totpCode: "Введите 6-значный код из приложения.",
  phone: "Введите номер в формате +7 700 000 00 00.",
} as const;

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, MSG.required)
  .max(254, MSG.email)
  .pipe(z.email(MSG.email));

export const passwordSchema = z
  .string()
  .min(12, MSG.passwordShort)
  .max(128, MSG.passwordLong);

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, MSG.required).max(128, MSG.passwordLong),
});

export const signUpSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    passwordConfirm: z.string().min(1, MSG.required),
  })
  .refine((v) => v.password === v.passwordConfirm, {
    message: MSG.passwordMismatch,
    path: ["passwordConfirm"],
  });

export const emailCodeSchema = z.string().regex(/^\d{8}$/, MSG.emailCode);
export const totpCodeSchema = z.string().regex(/^\d{6}$/, MSG.totpCode);

const textField = z.string().trim().min(1, MSG.required).max(200, "Не более 200 символов.");

export const profileSchema = z.object({
  fullName: textField,
  requestedClinic: textField,
  specialty: textField,
  phone: z
    .string()
    .trim()
    .min(1, MSG.required)
    .refine((v) => /^\+?\d{10,15}$/.test(v.replace(/[\s()-]/g, "")), MSG.phone),
});

export const resetRequestSchema = z.object({ email: emailSchema });

export const resetConfirmSchema = z.object({
  email: emailSchema,
  code: emailCodeSchema,
  newPassword: passwordSchema,
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
