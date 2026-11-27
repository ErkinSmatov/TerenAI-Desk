import { describe, expect, it } from "vitest";
import {
  authorLabel,
  formatGlucose,
  mealTypeLabel,
  noteErrorMessage,
  reasonText,
  statusLabel,
} from "./patientLabels";

describe("statusLabel", () => {
  it("подписи статусов", () => {
    expect(statusLabel("ok")).toBe("в норме");
    expect(statusLabel("warning")).toBe("внимание");
    expect(statusLabel("critical")).toBe("критично");
    expect(statusLabel("no_data", 4)).toBe("нет данных 4 дн.");
    expect(statusLabel("no_data")).toBe("нет данных 3 дн.");
  });
});

describe("reasonText", () => {
  it("давление", () => {
    expect(
      reasonText({
        code: "blood_pressure",
        level: "critical",
        sample: { systolic: 172, diastolic: 104, recordedAt: 1 },
      }),
    ).toBe("Давление 172/104 за последние 24 часа");
  });
  it("глюкоза в ммоль/л и мг/дл", () => {
    expect(
      reasonText({
        code: "glucose",
        level: "critical",
        sample: { value: 15.2, unit: "mmol/L", recordedAt: 1 },
      }),
    ).toBe("Глюкоза 15,2 ммоль/л за последние 24 часа");
    expect(
      reasonText({
        code: "glucose",
        level: "warning",
        sample: { value: 180, unit: "mg/dL", recordedAt: 1 },
      }),
    ).toBe("Глюкоза 10,0 ммоль/л за последние 24 часа");
  });
  it("нет данных, нечего оценить, в норме", () => {
    expect(reasonText({ code: "no_data", days: 3 })).toBe("Пациент не вносил записей 3 дн.");
    expect(reasonText({ code: "nothing_to_evaluate" })).toBe(
      "За последние 24 часа измерений нет. Данные за 3 дня в норме или не требуют оценки.",
    );
    expect(reasonText({ code: "in_range" })).toBe("Показатели за 24 часа в норме");
  });
});

describe("mealTypeLabel", () => {
  it("подписи приёмов", () => {
    expect(mealTypeLabel("breakfast")).toBe("Завтрак");
    expect(mealTypeLabel("lunch")).toBe("Обед");
    expect(mealTypeLabel("dinner")).toBe("Ужин");
    expect(mealTypeLabel("snack")).toBe("Перекус");
  });
});

describe("noteErrorMessage", () => {
  it("тексты ошибок", () => {
    expect(noteErrorMessage("empty_text")).toBe("Введите текст заметки.");
    expect(noteErrorMessage("too_long")).toBe("Заметка длиннее 2000 символов. Сократите текст.");
    expect(noteErrorMessage("not_author")).toBe("Эту заметку может изменить только её автор.");
    expect(noteErrorMessage("whatever")).toBe(
      "Не удалось сохранить заметку. Текст сохранён в поле, нажмите «Сохранить заметку» ещё раз.",
    );
  });
});

describe("formatGlucose", () => {
  it("единицы", () => {
    expect(formatGlucose(6.4, 115, "mmol")).toBe("6,4 ммоль/л");
    expect(formatGlucose(6.4, 115, "mgdl")).toBe("115 мг/дл");
  });
});

describe("authorLabel", () => {
  it("автор", () => {
    expect(authorLabel(null, false)).toBe("Бывший сотрудник клиники");
    expect(authorLabel("Иванова", true)).toBe("Вы");
    expect(authorLabel("Иванова", false)).toBe("Иванова");
  });
});
