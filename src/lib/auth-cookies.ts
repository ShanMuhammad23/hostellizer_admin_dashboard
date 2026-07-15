/**
 * NextAuth cookie policy for deployments behind HTTP (raw IP) or HTTPS.
 * Browsers refuse Secure cookies on http:// — the common cause of login loops.
 */

function nextAuthBaseUrl(): string {
  return (
    process.env.NEXTAUTH_URL ??
    process.env.AUTH_URL ??
    process.env.VERCEL_URL ??
    ""
  ).trim();
}

/** True only when the public app URL uses HTTPS (or explicitly forced). */
export function useSecureAuthCookies(): boolean {
  if (process.env.NEXTAUTH_SECURE_COOKIE === "false") return false;
  if (process.env.NEXTAUTH_SECURE_COOKIE === "true") return true;

  const url = nextAuthBaseUrl();
  if (url.startsWith("https://")) return true;
  if (url.startsWith("http://")) return false;

  // Unknown scheme — default to non-secure so raw-IP HTTP deploys work.
  return false;
}

/** Cookie Domain must not be set for IP hosts; optional for real domains only. */
export function authCookieDomain(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_DOMAIN?.trim();
  if (!raw) return undefined;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(raw)) return undefined;
  if (raw.includes(":")) return undefined;
  return raw;
}

export const sessionCookieName = useSecureAuthCookies()
  ? "__Secure-next-auth.session-token"
  : "next-auth.session-token";
