// Spike 80-03: Next 16.4.6 + @convex-dev/auth 0.0.90 — файл proxy.ts (итог см. SUMMARY).
import { convexAuthNextjsMiddleware } from "@convex-dev/auth/nextjs/server";

// В плане 80-03 handler только пропускает запрос; маршрутизация по стадиям — план 80-09.
export default convexAuthNextjsMiddleware(undefined, {
  cookieConfig: { maxAge: 60 * 60 * 12 },
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
