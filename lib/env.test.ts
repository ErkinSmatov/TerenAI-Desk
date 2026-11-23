import { afterEach, describe, expect, it, vi } from "vitest";
import { convexUrl } from "@/lib/env";

describe("convexUrl", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("возвращает значение, если оно начинается с https://", () => {
    vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "https://example.convex.cloud");
    expect(convexUrl()).toBe("https://example.convex.cloud");
  });

  it("бросает ошибку при пустом значении", () => {
    vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "");
    expect(() => convexUrl()).toThrow("NEXT_PUBLIC_CONVEX_URL");
  });

  it("бросает ошибку при не-https значении", () => {
    vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "http://example.com");
    expect(() => convexUrl()).toThrow("NEXT_PUBLIC_CONVEX_URL");
  });
});
