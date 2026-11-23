import "server-only";
import { redirect } from "next/navigation";
import type { Denied } from "./convexApi";
import { routeForStage } from "./stage";

// Отказ шлюза на странице /admin -> редирект (не-админ уходит на "/", остальные по стадии).
export function redirectDenied(denied: Denied): never {
  if (denied.code === "not_admin") redirect("/");
  redirect(routeForStage(denied));
}
