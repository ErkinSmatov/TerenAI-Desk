import { describe, expect, it } from "vitest";
import { routeForStage } from "./stage";
import type { GetMyStageResult } from "./convexApi";

const ready = (isPlatformAdmin: boolean): GetMyStageResult => ({
  ok: true,
  stage: "ready",
  status: "verified",
  isPlatformAdmin,
});

describe("routeForStage", () => {
  it("unauthenticated -> /sign-in", () => {
    expect(routeForStage({ ok: false, code: "unauthenticated" })).toBe("/sign-in");
  });
  it("session_expired как код -> /sign-in?expired=1", () => {
    expect(routeForStage({ ok: false, code: "session_expired" })).toBe("/sign-in?expired=1");
  });
  it("session_expired как стадия -> /sign-in?expired=1", () => {
    expect(
      routeForStage({ ok: true, stage: "session_expired", status: null, isPlatformAdmin: false }),
    ).toBe("/sign-in?expired=1");
  });
  it("not_doctor_account -> /sign-in?error=account", () => {
    expect(routeForStage({ ok: false, code: "not_doctor_account" })).toBe("/sign-in?error=account");
  });
  it("needs_profile -> /register/profile", () => {
    expect(
      routeForStage({ ok: true, stage: "needs_profile", status: null, isPlatformAdmin: false }),
    ).toBe("/register/profile");
  });
  it("needs_totp_setup -> /totp-setup", () => {
    expect(
      routeForStage({ ok: true, stage: "needs_totp_setup", status: "pending", isPlatformAdmin: false }),
    ).toBe("/totp-setup");
  });
  it("needs_totp -> /totp", () => {
    expect(
      routeForStage({ ok: true, stage: "needs_totp", status: "pending", isPlatformAdmin: false }),
    ).toBe("/totp");
  });
  it("ready + админ -> /admin", () => {
    expect(routeForStage(ready(true))).toBe("/admin");
  });
  it("ready + врач -> /", () => {
    expect(routeForStage(ready(false))).toBe("/");
  });
  it("2fa_required -> /totp, no_doctor_profile -> /register/profile", () => {
    expect(routeForStage({ ok: false, code: "2fa_required" })).toBe("/totp");
    expect(routeForStage({ ok: false, code: "no_doctor_profile" })).toBe("/register/profile");
  });
  it("прочие отказы -> /sign-in", () => {
    expect(routeForStage({ ok: false, code: "forbidden_role" })).toBe("/sign-in");
  });
});
