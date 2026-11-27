"use server";

import { z } from "zod";
import {
  api,
  type NoteId,
  type NoteView,
  type PatientCardResult,
  type PatientListResult,
  type PeriodDays,
  type UserId,
} from "@/lib/convexApi";
import { callMutation } from "@/lib/convexServer";
import { NOTE_SAVE_ERROR, noteErrorMessage } from "@/lib/patientLabels";
import { routeForStage } from "@/lib/stage";

export type PatientOutcome<T> =
  | { ok: true; data: T }
  | { ok: false; kind: "not_found" | "error"; message: string }
  | { redirect: string };

export type PatientListData = Extract<PatientListResult, { ok: true }>;
export type PatientCardData = Extract<PatientCardResult, { ok: true }>;

const NOT_FOUND_MESSAGE = "Пациент не найден";
const LIST_ERROR =
  "Не удалось загрузить список пациентов. Проверьте соединение и обновите страницу.";
const CARD_ERROR =
  "Не удалось загрузить данные пациента. Обновите страницу или повторите через минуту.";

const idSchema = z.string().min(1).max(64);
const periodSchema = z.union([z.literal(7), z.literal(30), z.literal(90)]);
const mealDaysSchema = z.number().int().min(7).max(90);
const textSchema = z.string().trim().min(1).max(2000);

const NOT_FOUND: PatientOutcome<never> = {
  ok: false,
  kind: "not_found",
  message: NOT_FOUND_MESSAGE,
};

const NOTE_CODES = new Set(["empty_text", "too_long", "not_author"]);

type Failure = { ok: false; code: string };

// Отказы шлюза -> страница входа или кабинет; no_active_link, not_found -> единый нейтральный исход.
// Ответы и аргументы не логируются (медданные пациента).
function toFailure(result: Failure, fallback: string): PatientOutcome<never> {
  switch (result.code) {
    case "unauthenticated":
    case "2fa_required":
    case "session_expired":
      return { redirect: routeForStage({ ok: false, code: result.code }) };
    case "not_verified":
    case "not_doctor_account":
    case "no_doctor_profile":
    case "no_clinic":
      return { redirect: "/" };
    case "no_active_link":
    case "not_found":
      return NOT_FOUND;
    default:
      return {
        ok: false,
        kind: "error",
        message: NOTE_CODES.has(result.code)
          ? noteErrorMessage(result.code)
          : fallback,
      };
  }
}

export async function listPatientsAction(): Promise<
  PatientOutcome<PatientListData>
> {
  try {
    const result = await callMutation(api.patients.list, {});
    if (!result.ok) return toFailure(result, LIST_ERROR);
    return { ok: true, data: result };
  } catch {
    return { ok: false, kind: "error", message: LIST_ERROR };
  }
}

export async function getPatientAction(
  patientId: string,
  periodDays: number,
  mealDays: number,
): Promise<PatientOutcome<PatientCardData>> {
  const id = idSchema.safeParse(patientId);
  const period = periodSchema.safeParse(periodDays);
  const meals = mealDaysSchema.safeParse(mealDays);
  if (!id.success || !period.success || !meals.success) return NOT_FOUND;
  try {
    const result = await callMutation(api.patients.get, {
      patientId: id.data as UserId,
      periodDays: period.data as PeriodDays,
      mealDays: meals.data,
    });
    if (!result.ok) return toFailure(result, CARD_ERROR);
    return { ok: true, data: result };
  } catch {
    // Невалидный v.id и сетевые ошибки: для карточки нейтральный «не найден».
    return NOT_FOUND;
  }
}

export async function createNoteAction(
  patientId: string,
  text: string,
): Promise<PatientOutcome<NoteView>> {
  const id = idSchema.safeParse(patientId);
  if (!id.success) return NOT_FOUND;
  const t = textSchema.safeParse(text);
  if (!t.success) {
    return {
      ok: false,
      kind: "error",
      message: noteErrorMessage(
        text.trim().length === 0 ? "empty_text" : "too_long",
      ),
    };
  }
  try {
    const result = await callMutation(api.notes.create, {
      patientId: id.data as UserId,
      text: t.data,
    });
    if (!result.ok) return toFailure(result, NOTE_SAVE_ERROR);
    return { ok: true, data: result.note };
  } catch {
    return { ok: false, kind: "error", message: NOTE_SAVE_ERROR };
  }
}

export async function updateNoteAction(
  patientId: string,
  noteId: string,
  text: string,
): Promise<PatientOutcome<NoteView>> {
  const id = idSchema.safeParse(patientId);
  const note = idSchema.safeParse(noteId);
  if (!id.success || !note.success) return NOT_FOUND;
  const t = textSchema.safeParse(text);
  if (!t.success) {
    return {
      ok: false,
      kind: "error",
      message: noteErrorMessage(
        text.trim().length === 0 ? "empty_text" : "too_long",
      ),
    };
  }
  try {
    const result = await callMutation(api.notes.update, {
      patientId: id.data as UserId,
      noteId: note.data as NoteId,
      text: t.data,
    });
    if (!result.ok) return toFailure(result, NOTE_SAVE_ERROR);
    return { ok: true, data: result.note };
  } catch {
    return { ok: false, kind: "error", message: NOTE_SAVE_ERROR };
  }
}

export async function deleteNoteAction(
  patientId: string,
  noteId: string,
): Promise<PatientOutcome<null>> {
  const id = idSchema.safeParse(patientId);
  const note = idSchema.safeParse(noteId);
  if (!id.success || !note.success) return NOT_FOUND;
  try {
    const result = await callMutation(api.notes.remove, {
      patientId: id.data as UserId,
      noteId: note.data as NoteId,
    });
    if (!result.ok) return toFailure(result, NOTE_SAVE_ERROR);
    return { ok: true, data: null };
  } catch {
    return { ok: false, kind: "error", message: NOTE_SAVE_ERROR };
  }
}
