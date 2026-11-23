"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

// Учётные данные живут только в памяти между /sign-up, /sign-in, /verify-email и /reset-password
// (для «Отправить код ещё раз» без повторного ввода). Не пишутся в хранилища браузера и URL.
type Credentials = { email: string; password: string };

type PendingCredentialsValue = Credentials & {
  setCredentials: (value: Partial<Credentials>) => void;
  clearCredentials: () => void;
};

const PendingCredentialsContext = createContext<PendingCredentialsValue | null>(null);

export function PendingCredentialsProvider({ children }: { children: ReactNode }) {
  const [credentials, setState] = useState<Credentials>({ email: "", password: "" });

  const value = useMemo<PendingCredentialsValue>(
    () => ({
      ...credentials,
      setCredentials: (next) => setState((prev) => ({ ...prev, ...next })),
      clearCredentials: () => setState({ email: "", password: "" }),
    }),
    [credentials],
  );

  return (
    <PendingCredentialsContext.Provider value={value}>
      {children}
    </PendingCredentialsContext.Provider>
  );
}

export function usePendingCredentials(): PendingCredentialsValue {
  const ctx = useContext(PendingCredentialsContext);
  if (!ctx) throw new Error("usePendingCredentials вызван вне PendingCredentialsProvider");
  return ctx;
}
