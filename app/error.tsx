"use client";

import { Button } from "@/components/ui/button";

// Граница ошибок сегмента (WR-05). Текст ошибки пользователю не показывается:
// в нём могут быть технические детали и персональные данные.
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-start justify-center gap-4 p-6">
      <h1 className="text-2xl leading-[1.2] font-semibold">Что-то пошло не так</h1>
      <p className="text-base text-[#5B6270]">
        Не удалось загрузить страницу. Проверьте соединение и повторите попытку.
      </p>
      <Button
        type="button"
        onClick={reset}
        className="h-11 rounded-full bg-[#C9F14C] px-5 text-sm font-semibold text-[#0A0D12] hover:bg-[#C9F14C]/90"
      >
        Повторить
      </Button>
    </main>
  );
}
