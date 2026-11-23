import { SignOutButton } from "@/components/auth/SignOutButton";

export function RejectedScreen() {
  return (
    <section className="rounded-[32px] bg-[#F7F7F7] p-8 text-[#0A0D12] shadow-sm">
      <h1 className="text-[28px] leading-[1.2] font-semibold tracking-tight">Заявка отклонена</h1>
      <p className="mt-3 max-w-xl text-base leading-normal font-normal">
        Мы не смогли подтвердить ваши данные. Напишите в поддержку Teren, и мы поможем разобраться.
      </p>
      <div className="mt-6">
        <SignOutButton />
      </div>
    </section>
  );
}
