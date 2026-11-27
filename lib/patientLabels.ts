import type { HealthStatus, MealType, StatusReason } from "./convexApi";

// Русские подписи карточки пациента (UI-SPEC, Copywriting Contract).
const NO_DATA_DEFAULT_DAYS = 3;
const MGDL_PER_MMOL = 18;

const STATUS_LABELS: Record<Exclude<HealthStatus, "no_data">, string> = {
  ok: "в норме",
  warning: "внимание",
  critical: "критично",
};

export function statusLabel(status: HealthStatus, noDataDays?: number): string {
  if (status === "no_data") return `нет данных ${noDataDays ?? NO_DATA_DEFAULT_DAYS} дн.`;
  return STATUS_LABELS[status];
}

function oneDecimal(value: number): string {
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

export function reasonText(reason: StatusReason): string {
  switch (reason.code) {
    case "no_data":
      return `Пациент не вносил записей ${reason.days} дн.`;
    case "nothing_to_evaluate":
      return "За последние 24 часа измерений нет. Данные за 3 дня в норме или не требуют оценки.";
    case "in_range":
      return "Показатели за 24 часа в норме";
    case "glucose": {
      const { value, unit } = reason.sample;
      const mmol = unit === "mg/dL" ? value / MGDL_PER_MMOL : value;
      return `Глюкоза ${oneDecimal(mmol)} ммоль/л за последние 24 часа`;
    }
    case "blood_pressure":
      return `Давление ${reason.sample.systolic}/${reason.sample.diastolic} за последние 24 часа`;
  }
}

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: "Завтрак",
  lunch: "Обед",
  dinner: "Ужин",
  snack: "Перекус",
};

export function mealTypeLabel(type: MealType): string {
  return MEAL_TYPE_LABELS[type];
}

const NOTE_ERRORS: Record<string, string> = {
  empty_text: "Введите текст заметки.",
  too_long: "Заметка длиннее 2000 символов. Сократите текст.",
  not_author: "Эту заметку может изменить только её автор.",
};

export const NOTE_SAVE_ERROR =
  "Не удалось сохранить заметку. Текст сохранён в поле, нажмите «Сохранить заметку» ещё раз.";

export function noteErrorMessage(code: string): string {
  return NOTE_ERRORS[code] ?? NOTE_SAVE_ERROR;
}

export function formatGlucose(mmol: number, mgdl: number, unit: "mmol" | "mgdl"): string {
  if (unit === "mgdl") return `${Math.round(mgdl)} мг/дл`;
  return `${oneDecimal(mmol)} ммоль/л`;
}

export function authorLabel(authorName: string | null, isMine: boolean): string {
  if (isMine) return "Вы";
  return authorName ?? "Бывший сотрудник клиники";
}
