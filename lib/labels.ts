import type { ClinicRole, DoctorStatus } from "./convexApi";

// Подписи ролей и статусов для кабинета и /admin.
const CLINIC_ROLE_LABELS: Record<ClinicRole, string> = {
  owner: "Владелец",
  doctor: "Врач",
  admin: "Администратор клиники",
};

const DOCTOR_STATUS_LABELS: Record<DoctorStatus, string> = {
  pending: "На проверке",
  verified: "Подтверждён",
  rejected: "Отклонён",
};

export function clinicRoleLabel(role: ClinicRole): string {
  return CLINIC_ROLE_LABELS[role];
}

export function doctorStatusLabel(status: DoctorStatus): string {
  return DOCTOR_STATUS_LABELS[status];
}
