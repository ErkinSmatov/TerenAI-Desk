import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { api, type DoctorId } from "@/lib/convexApi";
import { callQuery } from "@/lib/convexServer";
import { redirectDenied } from "@/lib/adminGuard";
import { StatusBadge } from "@/components/cabinet/StatusBadge";
import { DoctorActions } from "@/components/admin/DoctorActions";

export const metadata: Metadata = { title: "Карточка врача" };

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:gap-4">
      <dt className="w-56 shrink-0 text-sm text-[#5B6270]">{label}</dt>
      <dd className="text-sm font-semibold break-words">{value}</dd>
    </div>
  );
}

export default async function DoctorCardPage({
  params,
}: {
  params: Promise<{ doctorId: string }>;
}) {
  const { doctorId } = await params;
  const [doctorResult, clinicsResult] = await Promise.all([
    callQuery(api.admin.getDoctor, { doctorId: doctorId as DoctorId }),
    callQuery(api.admin.listClinics, {}),
  ]);
  if (!doctorResult.ok) {
    if ("code" in doctorResult && doctorResult.code === "not_found") notFound();
    redirectDenied(doctorResult as Parameters<typeof redirectDenied>[0]);
  }
  if (!clinicsResult.ok) redirectDenied(clinicsResult);
  const doctor = doctorResult.doctor;

  return (
    <section className="flex flex-col gap-6">
      <Link href="/admin/requests" className="text-sm font-semibold underline-offset-4 hover:underline">
        К заявкам
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl leading-[1.2] font-semibold">{doctor.fullName}</h1>
        <StatusBadge status={doctor.status} />
      </div>

      <div className="rounded-2xl bg-[#F4F5F7] p-6">
        <h2 className="mb-4 text-xl leading-[1.2] font-semibold">Данные регистрации</h2>
        <dl className="flex flex-col gap-3">
          <Row label="ФИО" value={doctor.fullName} />
          <Row label="Клиника (как введено)" value={doctor.requestedClinic} />
          <Row label="Специальность" value={doctor.specialty} />
          <Row label="Телефон" value={doctor.phone} />
          <Row label="Email" value={doctor.email} />
          <Row label="Дата подачи" value={new Date(doctor.createdAt).toLocaleDateString("ru-RU")} />
          <Row label="Второй фактор" value={doctor.totpConfigured ? "настроен" : "не настроен"} />
        </dl>
        <p className="mt-4 text-sm text-[#5B6270]">
          Документы проверяются по телефону или email вне сайта.
        </p>
      </div>

      <DoctorActions
        doctorId={doctor.doctorId}
        fullName={doctor.fullName}
        status={doctor.status}
        clinicId={doctor.clinicId}
        clinicRole={doctor.clinicRole}
        clinics={clinicsResult.clinics.map((c) => ({ clinicId: c.clinicId, name: c.name }))}
      />
    </section>
  );
}
