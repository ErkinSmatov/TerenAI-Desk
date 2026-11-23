import "server-only";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import type { FunctionArgs, FunctionReference, FunctionReturnType } from "convex/server";
import type { Denied } from "./convexApi";

// Серверные вызовы Convex с токеном из httpOnly cookies (RESEARCH Pattern 5, 6).
// Аргументы и ответы не логируются: в них коды, URI TOTP и персональные данные.

const UNAUTHENTICATED: Denied = { ok: false, code: "unauthenticated" };

export async function callQuery<Ref extends FunctionReference<"query", "public">>(
  ref: Ref,
  args: FunctionArgs<Ref>,
): Promise<FunctionReturnType<Ref> | Denied> {
  const token = await convexAuthNextjsToken();
  if (!token) return UNAUTHENTICATED;
  return fetchQuery(ref, args, { token });
}

export async function callMutation<Ref extends FunctionReference<"mutation", "public">>(
  ref: Ref,
  args: FunctionArgs<Ref>,
): Promise<FunctionReturnType<Ref> | Denied> {
  const token = await convexAuthNextjsToken();
  if (!token) return UNAUTHENTICATED;
  return fetchMutation(ref, args, { token });
}
