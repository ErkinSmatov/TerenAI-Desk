import type { Metadata } from "next";
import { api } from "@/lib/convexApi";
import { callQuery } from "@/lib/convexServer";
import { redirectDenied } from "@/lib/adminGuard";
import { DoctorsTable } from "@/components/admin/DoctorsTable";

export const metadata: Metadata = { title: "Врачи" };

export default async function DoctorsPage() {
  const result = await callQuery(api.admin.listDoctors, { status: "verified" });
  if (!result.ok) redirectDenied(result);

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl leading-[1.2] font-semibold">Врачи</h1>
      {result.truncated ? (
        <p className="text-sm text-[#5B6270]">Показаны не все записи: самые новые первыми.</p>
      ) : null}
      {result.doctors.length === 0 ? (
        <div className="rounded-2xl bg-[#F4F5F7] p-8">
          <h2 className="text-xl leading-[1.2] font-semibold">Подтверждённых врачей нет</h2>
          <p className="mt-2 text-sm text-[#5B6270]">
            Подтвердите заявку врача, и он появится в этом списке.
          </p>
        </div>
      ) : (
        <DoctorsTable doctors={result.doctors} />
      )}
    </section>
  );
}
