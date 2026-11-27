import Link from "next/link";

const TEXTS = {
  not_found: {
    title: "Пациент не найден",
    body: "Такого пациента нет среди ваших подключённых. Вернитесь к списку.",
  },
  access_closed: {
    title: "Доступ закрыт",
    body: "Пациент отозвал доступ к своим данным. Заметки сохранены и снова станут доступны, если пациент подключится к вам повторно.",
  },
} as const;

// Единый экран без данных пациента: причина отказа не раскрывается (T-82-50).
export function CardClosed({ variant }: { variant: "not_found" | "access_closed" }) {
  const t = TEXTS[variant];
  return (
    <div className="rounded-[32px] bg-[#F7F7F7] p-8 text-[#0A0D12] shadow-sm">
      <h1 className="text-[28px] leading-[1.2] font-semibold">{t.title}</h1>
      <p className="mt-3 max-w-xl text-base leading-normal text-[#5B6270]">{t.body}</p>
      <Link
        href="/patients"
        className="mt-6 inline-flex h-11 items-center rounded-full bg-[#C9F14C] px-6 text-base font-semibold text-[#0A0D12] outline-none hover:brightness-95 focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        К списку пациентов
      </Link>
    </div>
  );
}
