import type { Metadata } from "next";
import { api } from "@/lib/convexApi";
import { callQuery } from "@/lib/convexServer";
import { redirectDenied } from "@/lib/adminGuard";
import { CreateClinicDialog } from "@/components/admin/CreateClinicDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "Клиники" };

export default async function ClinicsPage() {
  const result = await callQuery(api.admin.listClinics, {});
  if (!result.ok) redirectDenied(result);

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl leading-[1.2] font-semibold">Клиники</h1>
        <CreateClinicDialog />
      </div>
      {result.clinics.length === 0 ? (
        <div className="rounded-2xl bg-[#F4F5F7] p-8">
          <h2 className="text-xl leading-[1.2] font-semibold">Клиник пока нет</h2>
          <p className="mt-2 text-sm text-[#5B6270]">
            Создайте клинику, чтобы привязать к ней врача.
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead>Врачей</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.clinics.map((clinic) => (
              <TableRow key={clinic.clinicId} className="h-14">
                <TableCell className="font-semibold">{clinic.name}</TableCell>
                <TableCell>{clinic.doctorCount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
