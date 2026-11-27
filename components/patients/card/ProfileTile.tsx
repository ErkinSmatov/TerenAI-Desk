import type { ReactNode } from "react";
import type { PatientProfileView } from "@/lib/convexApi";

const NOT_SET = "Не указано";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap justify-between gap-x-4 gap-y-1">
      <dt className="text-sm leading-[1.4] font-semibold text-td-ink-2">{label}</dt>
      <dd className="text-base leading-normal font-normal tabular-nums">{children}</dd>
    </div>
  );
}

function num(value: number | null | undefined, suffix: string): string {
  if (value === null || value === undefined) return NOT_SET;
  return `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 }).format(value)} ${suffix}`;
}

function formatDate(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
}

export function ProfileTile({
  profile,
  linkedAt,
}: {
  profile: PatientProfileView;
  linkedAt: number | null;
}) {
  const sex = profile.sex === "male" ? "Мужской" : profile.sex === "female" ? "Женский" : NOT_SET;
  const t = profile.targets;
  const steps = new Intl.NumberFormat("ru-RU").format(profile.stepsGoal);

  return (
    <section className="rounded-[36px] bg-td-tile p-6 text-td-ink">
      <h2 className="text-base font-semibold">Профиль и цели</h2>
      <dl className="mt-4 space-y-2">
        <Row label="Возраст">{num(profile.age, "лет")}</Row>
        <Row label="Пол">{sex}</Row>
        <Row label="Рост">{num(profile.heightCm, "см")}</Row>
        <Row label="Текущий вес">{num(profile.weightKg, "кг")}</Row>
        <Row label="Цель по весу">{profile.goalTrack ?? NOT_SET}</Row>
        <Row label="Калории в день">{num(t?.calories, "ккал")}</Row>
        <Row label="Белки / жиры / углеводы">
          {t ? `${Math.round(t.protein)} · ${Math.round(t.fat)} · ${Math.round(t.carbs)} г` : NOT_SET}
        </Row>
        <Row label="Цель по шагам">{steps} шагов (стандартная цель)</Row>
        <Row label="Подключён">{linkedAt === null ? NOT_SET : formatDate(linkedAt)}</Row>
      </dl>
    </section>
  );
}
