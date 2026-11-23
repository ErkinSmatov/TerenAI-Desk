import Link from "next/link";
import type { AdminDoctorRow } from "@/lib/convexApi";
import { StatusBadge } from "@/components/cabinet/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Строка целиком кликабельна: ссылка в первой ячейке растягивается на строку.
export function DoctorsTable({ doctors }: { doctors: AdminDoctorRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ФИО</TableHead>
          <TableHead>Клиника</TableHead>
          <TableHead>Специальность</TableHead>
          <TableHead>Дата подачи</TableHead>
          <TableHead>Статус</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {doctors.map((doctor) => (
          <TableRow key={doctor.doctorId} className="relative h-14 hover:bg-[#F4F5F7]">
            <TableCell className="font-semibold">
              <Link
                href={`/admin/doctors/${doctor.doctorId}`}
                className="outline-none after:absolute after:inset-0 focus-visible:after:ring-2 focus-visible:after:ring-[#0A0D12] focus-visible:after:ring-inset"
              >
                {doctor.fullName}
              </Link>
            </TableCell>
            <TableCell>{doctor.clinicName ?? doctor.requestedClinic}</TableCell>
            <TableCell>{doctor.specialty}</TableCell>
            <TableCell>{new Date(doctor.createdAt).toLocaleDateString("ru-RU")}</TableCell>
            <TableCell>
              <StatusBadge status={doctor.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
