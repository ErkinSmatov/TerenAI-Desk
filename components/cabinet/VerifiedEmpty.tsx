import type { ReactNode } from "react";

export function VerifiedEmpty({ action }: { action?: ReactNode }) {
  return (
    <section className="rounded-[36px] bg-td-tile p-8 text-td-ink">
      <h2 className="text-xl leading-[1.2] font-semibold">Пациентов пока нет</h2>
      <p className="mt-3 max-w-xl text-base leading-normal font-normal text-td-ink-2">
        Подключите пациента по номеру телефона или по коду из приложения Teren. Доступ к данным
        откроется после его подтверждения.
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </section>
  );
}
