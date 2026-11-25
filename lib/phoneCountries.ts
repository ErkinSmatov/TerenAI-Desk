// Страны для подключения пациента по номеру (Фаза 81).
// Копия списка CalYo lib/auth/phoneCountries.ts (TerenDesk — отдельный репозиторий).
// Авторитетная нормализация номера выполняется на сервере (normalizePhone), здесь только выбор.

export const CONNECT_COUNTRIES = [
  { iso: "KZ", name: "Казахстан", dialCode: "7" },
  { iso: "RU", name: "Россия", dialCode: "7" },
  { iso: "UZ", name: "Узбекистан", dialCode: "998" },
  { iso: "KG", name: "Кыргызстан", dialCode: "996" },
  { iso: "TJ", name: "Таджикистан", dialCode: "992" },
  { iso: "AZ", name: "Азербайджан", dialCode: "994" },
  { iso: "GE", name: "Грузия", dialCode: "995" },
  { iso: "BY", name: "Беларусь", dialCode: "375" },
  { iso: "AM", name: "Армения", dialCode: "374" },
  { iso: "MD", name: "Молдова", dialCode: "373" },
  { iso: "TM", name: "Туркменистан", dialCode: "993" },
] as const;

export type ConnectCountry = (typeof CONNECT_COUNTRIES)[number];

export const DEFAULT_CONNECT_COUNTRY = "KZ";
