import { describe, expect, it } from "vitest";
import {
  nextDelay,
  POLL_BACKOFF_AFTER_ERRORS,
  POLL_BACKOFF_MS,
  POLL_INTERVAL_MS,
} from "./pollingSchedule";

describe("nextDelay", () => {
  it("константы расписания", () => {
    expect(POLL_INTERVAL_MS).toBe(45_000);
    expect(POLL_BACKOFF_MS).toBe(120_000);
    expect(POLL_BACKOFF_AFTER_ERRORS).toBe(3);
  });

  it("без ошибок и до порога — 45 с", () => {
    expect(nextDelay(0)).toBe(45_000);
    expect(nextDelay(2)).toBe(45_000);
  });

  it("с 3 ошибок подряд — 120 с", () => {
    expect(nextDelay(3)).toBe(120_000);
    expect(nextDelay(10)).toBe(120_000);
  });

  it("отрицательное число трактуется как 0", () => {
    expect(nextDelay(-1)).toBe(45_000);
  });
});
