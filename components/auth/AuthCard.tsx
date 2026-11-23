import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AuthCardProps = {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
};

// Центральная карточка форм: 448px, радиус 32px, padding 24px. Title страницы задаётся через metadata.
export function AuthCard({ title, description, children, className }: AuthCardProps) {
  return (
    <section
      className={cn(
        "w-full max-w-[448px] rounded-[32px] bg-[#F7F7F7] p-6 text-[#0A0D12] shadow-sm",
        className,
      )}
    >
      <h1 className="text-[28px] leading-[1.2] font-semibold tracking-tight">{title}</h1>
      {description ? (
        <p className="mt-2 text-base font-normal text-[#5B6270]">{description}</p>
      ) : null}
      <div className="mt-6 flex flex-col gap-4">{children}</div>
    </section>
  );
}
