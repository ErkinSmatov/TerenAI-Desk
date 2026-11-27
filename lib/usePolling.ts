"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { nextDelay } from "./pollingSchedule";

type UsePollingOptions<T> = {
  fetcher: () => Promise<T>;
  onResult: (result: T) => void;
  isError: (result: T) => boolean;
  enabled: boolean;
  key?: string;
};

/**
 * Опрос цепочкой setTimeout: следующий запуск ставится только после ответа
 * (Server Actions на клиенте выполняются по очереди). В скрытой вкладке пауза,
 * при возврате на вкладку — немедленный запрос. Данные хранит вызывающий компонент.
 */
export function usePolling<T>(opts: UsePollingOptions<T>): {
  refreshNow: () => void;
  consecutiveErrors: number;
} {
  const { enabled, key } = opts;
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);

  const optsRef = useRef(opts);
  useEffect(() => {
    optsRef.current = opts;
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorsRef = useRef(0);
  const activeRef = useRef(false);
  const inFlightRef = useRef(false);
  const runRef = useRef<() => void>(() => {});
  const prevKeyRef = useRef<{ key: string | undefined } | null>(null);

  useEffect(() => {
    if (!enabled) return;
    activeRef.current = true;
    errorsRef.current = 0;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- сброс ошибок при смене key/enabled
    setConsecutiveErrors(0);

    const clearTimer = () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const schedule = () => {
      clearTimer();
      if (!activeRef.current || document.hidden) return;
      timerRef.current = setTimeout(run, nextDelay(errorsRef.current));
    };

    const run = async () => {
      clearTimer();
      if (!activeRef.current || inFlightRef.current) return;
      inFlightRef.current = true;
      let failed = false;
      try {
        const result = await optsRef.current.fetcher();
        if (!activeRef.current) return; // ответ после остановки игнорируется
        failed = optsRef.current.isError(result);
        if (!failed) optsRef.current.onResult(result);
      } catch {
        failed = true;
      } finally {
        inFlightRef.current = false;
      }
      if (!activeRef.current) return;
      errorsRef.current = failed ? errorsRef.current + 1 : 0;
      setConsecutiveErrors(errorsRef.current);
      schedule();
    };

    const onVisibility = () => {
      if (document.hidden) {
        clearTimer();
      } else {
        void run();
      }
    };

    runRef.current = () => void run();
    document.addEventListener("visibilitychange", onVisibility);
    const keyChanged = prevKeyRef.current !== null && prevKeyRef.current.key !== key;
    prevKeyRef.current = { key };
    if (keyChanged) {
      // смена key — немедленный запрос; первый запуск ждёт интервал (данные уже с сервера)
      void run();
    } else {
      schedule();
    }

    return () => {
      activeRef.current = false;
      inFlightRef.current = false;
      clearTimer();
      document.removeEventListener("visibilitychange", onVisibility);
      runRef.current = () => {};
    };
  }, [enabled, key]);

  const refreshNow = useCallback(() => {
    runRef.current();
  }, []);

  return { refreshNow, consecutiveErrors };
}
