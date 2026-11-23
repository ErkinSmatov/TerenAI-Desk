export function convexUrl(): string {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url || !url.startsWith("https://")) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL не задан");
  }
  return url;
}
