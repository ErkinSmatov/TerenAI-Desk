import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-start justify-center gap-4 p-6">
      <h1 className="text-2xl leading-[1.2] font-semibold">Страница не найдена</h1>
      <p className="text-base text-[#5B6270]">Такой страницы нет или она была удалена.</p>
      <Link
        href="/"
        className="text-sm font-semibold text-[#0A0D12] underline underline-offset-4"
      >
        На главную
      </Link>
    </main>
  );
}
