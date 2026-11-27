// Ручные типизированные ссылки на публичные функции Convex Фазы 80.
// Источник истины: CalYo convex/doctor/** и convex/admin/**. При изменении бэкенда обновлять
// и lib/convexApi.manifest.json (сверка с CalYo выполняется в плане 80-14).
// "server-only" не ставим: ссылки — это просто строки. Импортируется только makeFunctionReference.
import { makeFunctionReference } from "convex/server";

// ---- Брендированные Id (генерируемые типы CalYo недоступны) ----
export type DoctorId = string & { __table: "doctors" };
export type ClinicId = string & { __table: "clinics" };
export type UserId = string & { __table: "users" };
export type PhoneConnectionId = string & { __table: "phoneConnections" };
export type NoteId = string & { __table: "doctorNotes" };

// ---- Общие типы ----
export type DenyCode =
  | "unauthenticated"
  | "not_doctor_account"
  | "2fa_required"
  | "session_expired"
  | "no_doctor_profile"
  | "not_verified"
  | "no_clinic"
  | "forbidden_role"
  | "not_admin"
  | "no_active_link";

export type Denied = { ok: false; code: DenyCode };

export type ClinicRole = "owner" | "doctor" | "admin";
export type DoctorStatus = "pending" | "verified" | "rejected";
export type Stage =
  | "needs_profile"
  | "needs_totp_setup"
  | "needs_totp"
  | "session_expired"
  | "ready";

// ---- doctor/auth ----
export type GetMyStageResult =
  | Denied
  | { ok: true; stage: Stage; status: DoctorStatus | null; isPlatformAdmin: boolean };

export type ProfileField = "fullName" | "requestedClinic" | "specialty" | "phone";

export type CompleteRegistrationArgs = {
  fullName: string;
  requestedClinic: string;
  specialty: string;
  phone: string;
};
export type CompleteRegistrationResult =
  | Denied
  | { ok: true }
  | { ok: false; code: "invalid_input"; field: ProfileField }
  | { ok: false; code: "already_registered" | "admin_account" };

export type TotpFailCode =
  | "profile_required"
  | "already_enrolled"
  | "not_enrolled"
  | "invalid_code"
  | "locked"
  | "session_expired";

export type TotpResult =
  | { ok: true }
  | Denied
  | { ok: false; code: TotpFailCode; retryAfterMs?: number };

export type BeginTotpEnrollmentResult =
  | { ok: true; uri: string; secretBase32: string }
  | Denied
  | { ok: false; code: TotpFailCode; retryAfterMs?: number };

export type SimpleResult = Denied | { ok: true };

// ---- doctor/profile ----
export type GetMyProfileResult =
  | Denied
  | {
      ok: true;
      fullName: string;
      requestedClinic: string;
      specialty: string;
      phone: string;
      email: string;
      status: DoctorStatus;
      clinicName: string | null;
      clinicRole: ClinicRole | null;
    };

// ---- admin ----
export type AdminDoctorRow = {
  doctorId: DoctorId;
  fullName: string;
  requestedClinic: string;
  specialty: string;
  createdAt: number;
  status: DoctorStatus;
  clinicName: string | null;
};
export type ListDoctorsResult = Denied | { ok: true; doctors: AdminDoctorRow[]; truncated: boolean };

export type AdminDoctorDetail = {
  doctorId: DoctorId;
  userId: UserId;
  fullName: string;
  requestedClinic: string;
  specialty: string;
  phone: string;
  email: string;
  status: DoctorStatus;
  createdAt: number;
  clinicId: ClinicId | null;
  clinicRole: ClinicRole | null;
  totpConfigured: boolean;
};
export type GetDoctorResult =
  | Denied
  | { ok: false; code: "not_found" }
  | { ok: true; doctor: AdminDoctorDetail };

export type ListClinicsResult =
  | Denied
  | {
      ok: true;
      clinics: Array<{ clinicId: ClinicId; name: string; doctorCount: number }>;
      truncated: boolean;
    };

export type CreateClinicResult =
  | Denied
  | { ok: true; clinicId: ClinicId }
  | { ok: false; code: "invalid_input" | "duplicate" };

export type AdminActionResult =
  | Denied
  | { ok: true }
  | { ok: false; code: "not_found" | "not_web_doctor" | "clinic_required" };

// ---- doctor/connect (Фаза 81) ----
export type ConnectionStatus = "awaiting_code" | "awaiting_install" | "awaiting_patient" | "expired";

export type StartPhoneResult =
  | Denied
  | { ok: true; connectionId: PhoneConnectionId; phoneMasked: string }
  | { ok: false; code: "invalid_phone" | "rate_limited" | "already_pending" };

export type GetConnectionResult =
  | Denied
  | { ok: false; code: "not_found" | "not_verified" }
  | {
      ok: true;
      status: ConnectionStatus;
      sendState: "sending" | "sent" | "failed";
      sendError: string | null;
      phoneMasked: string;
      codeExpiresAt: number | null;
      attemptsLeft: number;
    };

export type ConfirmPhoneResult =
  | Denied
  | {
      ok: true;
      status: "awaiting_patient" | "awaiting_install" | "already_connected" | "unavailable";
    }
  | { ok: false; code: "invalid_code"; attemptsLeft: number }
  | {
      ok: false;
      code: "code_expired" | "code_sending" | "too_many_attempts" | "rate_limited" | "not_found";
    };

export type RedeemPatientCodeResult =
  | Denied
  | { ok: true; status: "pending" | "active" }
  | { ok: false; code: "not_found" | "not_accepted" | "rate_limited" };

export type PendingConnectionRow = {
  connectionId: PhoneConnectionId;
  phoneMasked: string;
  status: "awaiting_install" | "awaiting_patient" | "expired";
  expiresAt: number;
  createdAt: number;
};

export type ListPendingResult =
  | Denied
  | { ok: false; code: "not_verified" }
  | { ok: true; truncated: boolean; connections: PendingConnectionRow[] };

export type CancelConnectionResult = Denied | { ok: true } | { ok: false; code: "not_found" };

// ---- doctor/patients и doctor/notes (Фаза 82) ----
// Типы переписаны вручную из CalYo (lib/doctor/trafficLight.ts, convex/utils/doctor/*).
export type Level = "ok" | "warning" | "critical";
export type HealthStatus = Level | "no_data";
export type GlucoseSample = { value: number; unit: "mmol/L" | "mg/dL"; recordedAt: number };
export type BpSample = { systolic: number; diastolic: number; recordedAt: number };

export type StatusReason =
  | { code: "no_data"; days: number }
  | { code: "nothing_to_evaluate" }
  | { code: "in_range" }
  | { code: "glucose"; level: Level; sample: GlucoseSample }
  | { code: "blood_pressure"; level: Level; sample: BpSample };

export type PatientStatus = {
  status: HealthStatus;
  reason: StatusReason;
  lastRecordAt: number | null;
};

export type PeriodDays = 7 | 30 | 90;

export type GlucosePoint = {
  t: number;
  mmol: number;
  mgdl: number;
  minMmol: number | null;
  maxMmol: number | null;
  status: Level;
};
export type BpPoint = { t: number; systolic: number; diastolic: number; status: Level };
export type Series = {
  periodDays: PeriodDays;
  granularity: "raw" | "daily";
  glucose: GlucosePoint[];
  bloodPressure: BpPoint[];
  weight: { t: number; kg: number }[];
  steps: { date: string; steps: number }[];
  stepsGoal: number;
  ranges: {
    glucoseMmol: { min: number; max: number };
    glucoseMgdl: { min: number; max: number };
    systolic: { min: number; max: number };
    diastolic: { min: number; max: number };
  };
};

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type Macros = { calories: number; protein: number; fat: number; carbs: number };
export type FeedMeal = {
  mealId: string;
  eatenAt: number;
  mealType: MealType;
  name: string | null;
  grams: number | null;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
};
export type MealDay = { date: string; totals: Macros; meals: FeedMeal[] };
export type MealFeed = {
  days: MealDay[];
  targets: Macros | null;
  hasMore: boolean;
  mealDays: number;
};

export type NoteView = {
  noteId: NoteId;
  authorName: string | null;
  isMine: boolean;
  text: string;
  createdAt: number;
  updatedAt: number | null;
};

export type PatientListRow = {
  patientId: UserId;
  displayName: string;
  status: PatientStatus;
  approximate: boolean;
  lastGlucose: GlucoseSample | null;
  lastBloodPressure: BpSample | null;
};
export type PatientListResult =
  | Denied
  | { ok: true; generatedAt: number; truncated: boolean; rows: PatientListRow[] };

export type PatientProfileView = {
  age: number | null;
  sex: "male" | "female" | null;
  heightCm: number | null;
  weightKg: number | null;
  goalTrack: string | null;
  targets: Macros | null;
  stepsGoal: number;
};

export type PatientCardResult =
  | Denied
  | {
      ok: true;
      generatedAt: number;
      patient: { patientId: UserId; displayName: string; linkedAt: number | null };
      profile: PatientProfileView;
      status: PatientStatus;
      approximate: boolean;
      series: Series;
      meals: MealFeed;
      notes: NoteView[];
    };

export type NoteFailCode = "empty_text" | "too_long" | "not_found" | "not_author";
export type NoteResult =
  | Denied
  | { ok: true; note: NoteView }
  | { ok: false; code: NoteFailCode };
export type NoteRemoveResult = Denied | { ok: true } | { ok: false; code: NoteFailCode };

type NoArgs = Record<string, never>;

export const api = {
  doctor: {
    getMyStage: makeFunctionReference<"query", NoArgs, GetMyStageResult>(
      "doctor/auth/getMyStage:default",
    ),
    completeRegistration: makeFunctionReference<
      "mutation",
      CompleteRegistrationArgs,
      CompleteRegistrationResult
    >("doctor/auth/completeRegistration:default"),
    beginTotpEnrollment: makeFunctionReference<"mutation", NoArgs, BeginTotpEnrollmentResult>(
      "doctor/auth/beginTotpEnrollment:default",
    ),
    confirmTotpEnrollment: makeFunctionReference<"mutation", { code: string }, TotpResult>(
      "doctor/auth/confirmTotpEnrollment:default",
    ),
    verifyTotp: makeFunctionReference<"mutation", { code: string }, TotpResult>(
      "doctor/auth/verifyTotp:default",
    ),
    recordSessionStart: makeFunctionReference<"mutation", NoArgs, SimpleResult>(
      "doctor/auth/recordSessionStart:default",
    ),
    recordSignOut: makeFunctionReference<"mutation", NoArgs, SimpleResult>(
      "doctor/auth/recordSignOut:default",
    ),
    getMyProfile: makeFunctionReference<"query", NoArgs, GetMyProfileResult>(
      "doctor/profile/getMyProfile:default",
    ),
  },
  admin: {
    listDoctors: makeFunctionReference<"query", { status: DoctorStatus }, ListDoctorsResult>(
      "admin/listDoctors:default",
    ),
    getDoctor: makeFunctionReference<"query", { doctorId: DoctorId }, GetDoctorResult>(
      "admin/getDoctor:default",
    ),
    listClinics: makeFunctionReference<"query", NoArgs, ListClinicsResult>(
      "admin/listClinics:default",
    ),
    createClinic: makeFunctionReference<"mutation", { name: string }, CreateClinicResult>(
      "admin/createClinic:default",
    ),
    linkClinic: makeFunctionReference<
      "mutation",
      { doctorId: DoctorId; clinicId: ClinicId },
      AdminActionResult
    >("admin/linkClinic:default"),
    setRole: makeFunctionReference<
      "mutation",
      { doctorId: DoctorId; role: ClinicRole },
      AdminActionResult
    >("admin/setRole:default"),
    verifyDoctor: makeFunctionReference<"mutation", { doctorId: DoctorId }, AdminActionResult>(
      "admin/verifyDoctor:default",
    ),
    rejectDoctor: makeFunctionReference<"mutation", { doctorId: DoctorId }, AdminActionResult>(
      "admin/rejectDoctor:default",
    ),
    resetTotp: makeFunctionReference<"mutation", { doctorId: DoctorId }, AdminActionResult>(
      "admin/resetTotp:default",
    ),
  },
  // Группа connect отдельная от doctor: тест обходит ровно два уровня (группа -> ссылка).
  connect: {
    startPhone: makeFunctionReference<
      "mutation",
      { country: string; phone: string },
      StartPhoneResult
    >("doctor/connect/startPhone:default"),
    getConnection: makeFunctionReference<
      "query",
      { connectionId: PhoneConnectionId },
      GetConnectionResult
    >("doctor/connect/getConnection:default"),
    confirmPhone: makeFunctionReference<
      "mutation",
      { connectionId: PhoneConnectionId; code: string },
      ConfirmPhoneResult
    >("doctor/connect/confirmPhone:default"),
    redeemPatientCode: makeFunctionReference<"mutation", { code: string }, RedeemPatientCodeResult>(
      "doctor/connect/redeemPatientCode:default",
    ),
    listPending: makeFunctionReference<"query", NoArgs, ListPendingResult>(
      "doctor/connect/listPending:default",
    ),
    cancel: makeFunctionReference<
      "mutation",
      { connectionId: PhoneConnectionId },
      CancelConnectionResult
    >("doctor/connect/cancel:default"),
  },
  patients: {
    list: makeFunctionReference<"mutation", NoArgs, PatientListResult>(
      "doctor/patients/list:default",
    ),
    get: makeFunctionReference<
      "mutation",
      { patientId: UserId; periodDays: PeriodDays; mealDays: number },
      PatientCardResult
    >("doctor/patients/get:default"),
  },
  notes: {
    create: makeFunctionReference<"mutation", { patientId: UserId; text: string }, NoteResult>(
      "doctor/notes/create:default",
    ),
    update: makeFunctionReference<
      "mutation",
      { patientId: UserId; noteId: NoteId; text: string },
      NoteResult
    >("doctor/notes/update:default"),
    remove: makeFunctionReference<
      "mutation",
      { patientId: UserId; noteId: NoteId },
      NoteRemoveResult
    >("doctor/notes/remove:default"),
  },
} as const;
