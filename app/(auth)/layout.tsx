import type { ReactNode } from "react";
import { PendingCredentialsProvider } from "@/components/auth/PendingCredentials";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#EDEDED] px-4 py-10">
      <PendingCredentialsProvider>{children}</PendingCredentialsProvider>
    </main>
  );
}
