export const POLL_INTERVAL_MS = 45_000;
export const POLL_BACKOFF_MS = 120_000;
export const POLL_BACKOFF_AFTER_ERRORS = 3;

export function nextDelay(consecutiveErrors: number): number {
  const errors = Math.max(0, consecutiveErrors);
  return errors >= POLL_BACKOFF_AFTER_ERRORS ? POLL_BACKOFF_MS : POLL_INTERVAL_MS;
}
