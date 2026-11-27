"use client";

import { Expand } from "lucide-react";

// «Развернуть» из макета «Главной»: переключает полноэкранный режим браузера.
export function ExpandButton() {
  function toggle() {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void document.documentElement.requestFullscreen?.().catch(() => {});
    }
  }
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Развернуть на весь экран"
      className="flex size-[46px] shrink-0 items-center justify-center rounded-full bg-td-pill text-td-ink outline-none focus-visible:ring-2 focus-visible:ring-td-ink max-sm:hidden"
    >
      <Expand className="size-5" aria-hidden />
    </button>
  );
}
