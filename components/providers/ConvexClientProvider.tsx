"use client";

import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
import { ConvexReactClient } from "convex/react";
import type { ReactNode } from "react";
import { convexUrl } from "@/lib/env";

// NEXT_PUBLIC_* подставляется при сборке, поэтому доступ к process.env в клиенте безопасен.
const convex = new ConvexReactClient(convexUrl());

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return <ConvexAuthNextjsProvider client={convex}>{children}</ConvexAuthNextjsProvider>;
}
