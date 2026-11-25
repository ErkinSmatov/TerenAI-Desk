import type { Metadata } from "next";
import Link from "next/link";
import { api, type DoctorStatus } from "@/lib/convexApi";
import { callQuery } from "@/lib/convexServer";
import { redirectDenied } from "@/lib/adminGuard";
import { DoctorsTable } from "@/components/admin/DoctorsTable";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Заявки" };

const TABS: Array<{ status: DoctorStatus; label: string }> = [
  { status: "pending", label: "Ожидают" },
  { status: "verified", label: "Подтверждены" },
  { status: "rejected", label: "Отклонены" },
];

function parseStatus(value: string | string[] | undefined): DoctorStatus {
  return value === "verified" || value === "rejected" ? value : "pending";
}

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  const status = parseStatus((await searchParams).status);
  const result = await callQuery(api.admin.listDoctors, { status });
  if (!result.ok) redirectDenied(result);

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl leading-[1.2] font-semibold">Заявки</h1>
      <nav aria-label="Фильтр по статусу" className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <Link
            key={tab.status}
            href={`/admin/requests?status=${tab.status}`}
            aria-current={tab.status === status ? "page" : undefined}
            className={cn(
              "flex h-11 items-center rounded-full px-5 text-sm font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#0A0D12] focus-visible:ring-offset-2",
              tab.status === status ? "bg-[#C9F14C] text-[#0A0D12]" : "bg-[#F4F5F7] text-[#0A0D12]",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      {result.truncated ? (
        <p className="text-sm text-[#5B6270]">Показаны не все записи: самые новые первыми.</p>
      ) : null}
      {result.doctors.length === 0 ? (
        <div className="rounded-2xl bg-[#F4F5F7] p-8">
          <h2 className="text-xl leading-[1.2] font-semibold">
            {status === "pending" ? "Новых заявок нет" : "Заявок нет"}
          </h2>
          {status === "pending" ? (
            <p className="mt-2 text-sm text-[#5B6270]">
              Когда врач зарегистрируется, заявка появится здесь.
            </p>
          ) : null}
        </div>
      ) : (
        <DoctorsTable doctors={result.doctors} />
      )}
    </section>
  );
}
