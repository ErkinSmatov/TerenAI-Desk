import type { ReactNode } from "react";

export function VerifiedEmpty({ action }: { action?: ReactNode }) {
  return (
    <section className="rounded-[32px] bg-[#F7F7F7] p-8 text-[#0A0D12] shadow-sm">
      <h2 className="text-xl leading-[1.2] font-semibold">Пациентов пока нет</h2>
      <p className="mt-3 max-w-xl text-base leading-normal font-normal text-[#5B6270]">
        Подключите пациента по номеру телефона или по коду из приложения Teren. Доступ к данным
        откроется после его подтверждения.
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </section>
  );
}
