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
  patientCode: "Введите 5-значный код из приложения пациента.",
  connectCode: "Введите 6-значный код из WhatsApp.",
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

// Подключение пациента (Фаза 81). Страна — из закрытого списка CalYo, номер нормализует сервер.
export const connectPhoneSchema = z.object({
  country: z.enum(["KZ", "RU", "UZ", "KG", "TJ", "AZ", "GE", "BY", "AM", "MD", "TM"]),
  phone: z
    .string()
    .trim()
    .min(5, MSG.phone)
    .max(32, MSG.phone)
    .regex(/^[\d\s()+-]+$/, MSG.phone),
});
export const connectCodeSchema = z.string().regex(/^\d{6}$/, MSG.connectCode);
export const patientCodeSchema = z.string().regex(/^\d{5}$/, MSG.patientCode);

export const resetRequestSchema = z.object({ email: emailSchema });

export const resetConfirmSchema = z.object({
  email: emailSchema,
  code: emailCodeSchema,
  newPassword: passwordSchema,
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
