// Next 16: proxy.ts (spike 80-03). Здесь только UX-защита маршрутов и CSP с nonce.
// Авторитетное решение о доступе принимает шлюз Convex (80-04); стадии в proxy не проверяются.
import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in",
  "/sign-up",
  "/verify-email",
  "/reset-password(.*)",
]);

function createNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function buildCsp(nonce: string, isDev: boolean): string {
  const scriptSrc = ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'"];
  if (isDev) scriptSrc.push("'unsafe-eval'");
  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self' https://*.convex.cloud wss://*.convex.cloud",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

export default convexAuthNextjsMiddleware(
  async (request, { convexAuth }) => {
    const nonce = createNonce();
    const csp = buildCsp(nonce, process.env.NODE_ENV === "development");

    let response: NextResponse;
    if (!isPublicRoute(request) && !(await convexAuth.isAuthenticated())) {
      response = nextjsMiddlewareRedirect(request, "/sign-in");
    } else {
      // Next применяет nonce к своим скриптам, читая CSP из заголовков запроса.
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-nonce", nonce);
      requestHeaders.set("Content-Security-Policy", csp);
      response = NextResponse.next({ request: { headers: requestHeaders } });
    }
    response.headers.set("Content-Security-Policy", csp);
    return response;
  },
  { cookieConfig: { maxAge: 60 * 60 * 12 } },
);

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
