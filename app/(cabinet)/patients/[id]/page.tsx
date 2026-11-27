import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { callQuery } from "@/lib/convexServer";
import { api } from "@/lib/convexApi";
import { routeForStage } from "@/lib/stage";
import { getPatientAction } from "@/app/actions/patients";
import { PendingScreen } from "@/components/cabinet/PendingScreen";
import { RejectedScreen } from "@/components/cabinet/RejectedScreen";
import { CardClosed } from "@/components/patients/card/CardClosed";
import { PatientCard } from "@/components/patients/card/PatientCard";

// Имя пациента в заголовок ставит клиентская карточка: повторный вызов мутации ради метаданных не нужен.
export const metadata: Metadata = { title: "Пациент" };

const CARD_ERROR =
  "Не удалось загрузить данные пациента. Обновите страницу или повторите через минуту.";

export default async function PatientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const profile = await callQuery(api.doctor.getMyProfile, {});
  if (!profile.ok) {
    redirect(routeForStage(profile));
  }
  if (profile.status === "pending") return <PendingScreen profile={profile} />;
  if (profile.status === "rejected") return <RejectedScreen />;

  // Права проверяет только сервер Convex; чужой и невалидный id дают один экран (T-82-48).
  const outcome = await getPatientAction(id, 7, 7);
  if ("redirect" in outcome) redirect(outcome.redirect);
  if (!outcome.ok) {
    if (outcome.kind === "not_found") return <CardClosed variant="not_found" />;
    return <p className="text-base text-[#5B6270]">{CARD_ERROR}</p>;
  }

  return <PatientCard patientId={id} initialData={outcome.data} />;
}
