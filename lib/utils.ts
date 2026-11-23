// Утилита объединения классов без внешних зависимостей.
// shadcn по умолчанию тянет пакет "cn" (или clsx + tailwind-merge), которого нет в
// аудированном списке пакетов (80-03, задача 1), поэтому здесь минимальная замена.
// Слияние конфликтующих tailwind-классов (twMerge) не выполняется.
type ClassValue = string | number | null | undefined | false | ClassValue[];

export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];
  const walk = (v: ClassValue) => {
    if (Array.isArray(v)) v.forEach(walk);
    else if (typeof v === "string" || typeof v === "number") {
      if (v !== "") out.push(String(v));
    }
  };
  inputs.forEach(walk);
  return out.join(" ");
}
