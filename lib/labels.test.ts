import { describe, expect, it } from "vitest";
import { clinicRoleLabel, doctorStatusLabel } from "./labels";

describe("clinicRoleLabel", () => {
  it("возвращает русские подписи ролей", () => {
    expect(clinicRoleLabel("owner")).toBe("Владелец");
    expect(clinicRoleLabel("doctor")).toBe("Врач");
    expect(clinicRoleLabel("admin")).toBe("Администратор клиники");
  });
});

describe("doctorStatusLabel", () => {
  it("возвращает русские подписи статусов", () => {
    expect(doctorStatusLabel("pending")).toBe("На проверке");
    expect(doctorStatusLabel("verified")).toBe("Подтверждён");
    expect(doctorStatusLabel("rejected")).toBe("Отклонён");
  });
});
