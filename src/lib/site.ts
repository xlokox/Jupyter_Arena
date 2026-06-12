/** Canonical site origin for SEO surfaces; set NEXT_PUBLIC_SITE_URL in prod. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");
