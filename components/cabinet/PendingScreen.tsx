import { HeroBlob } from "@/components/cabinet/HeroBlob";

type PendingProfile = {
  fullName: string;
  requestedClinic: string;
  specialty: string;
  phone: string;
  email: string;
};

const UNAVAILABLE = ["Подключение пациентов", "Приглашения", "Просмотр данных пациентов"];

// Экран pending (D-03): только пояснение, список недоступного и данные для чтения.
// Действий нет; недоступные функции не показываются заблокированными.
export function PendingScreen({ profile }: { profile: PendingProfile }) {
  const rows: Array<[string, string]> = [
    ["ФИО", profile.fullName],
    ["Клиника", profile.requestedClinic],
    ["Специальность", profile.specialty],
    ["Телефон", profile.phone],
    ["Email", profile.email],
  ];
  return (
    <div className="flex flex-col gap-8">
      <section className="relative overflow-hidden rounded-[32px] bg-white p-8 text-[#0A0D12] shadow-sm">
        <HeroBlob />
        <div className="relative max-w-xl">
          <h1 className="text-[28px] leading-[1.2] font-semibold tracking-tight">
            Заявка на проверке
          </h1>
          <p className="mt-3 text-base leading-normal font-normal">
            Мы свяжемся с вами по телефону или email, которые вы указали. До проверки доступен
            только ваш профиль.
          </p>
        </div>
      </section>

      <div className="grid gap-8 md:grid-cols-2">
        <section className="rounded-3xl bg-[#F7F7F7] p-6 text-[#0A0D12] shadow-sm">
          <h2 className="text-xl leading-[1.2] font-semibold">Что пока недоступно</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-base font-normal">
            {UNAVAILABLE.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="rounded-3xl bg-[#F7F7F7] p-6 text-[#0A0D12] shadow-sm">
          <h2 className="text-xl leading-[1.2] font-semibold">Ваши данные</h2>
          <dl className="mt-4 space-y-3">
            {rows.map(([label, value]) => (
              <div key={label}>
                <dt className="text-sm leading-[1.4] font-semibold text-[#5B6270]">{label}</dt>
                <dd className="text-base font-normal break-words">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  );
}
