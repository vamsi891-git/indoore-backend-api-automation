/**
 * Local backend often mounts routes at `/auth/...` (API_BASE_PATH empty).
 * Live mounts under `/indore/...`. Set STRIP_INDORE_PREFIX=true in `.env`
 * to rewrite `/indore/...` → `/...` for local testing without editing every API file.
 */
import { getEnv, setStripIndorePrefix } from "../config/env.schema";

export function enableStripIndorePrefix(): void {
  if (
    process.env.STRIP_INDORE_PREFIX?.trim().toLowerCase() === "0" ||
    process.env.STRIP_INDORE_PREFIX?.trim().toLowerCase() === "false" ||
    process.env.STRIP_INDORE_PREFIX?.trim().toLowerCase() === "no"
  ) {
    return;
  }
  setStripIndorePrefix(true);
}

function shouldAutoStripIndorePrefix(): boolean {
  try {
    const base = process.env.BASE_URL ?? "";
    const host = new URL(normalizeApiBaseUrl(base)).hostname;
    return host === "api.mdm.mppkvvcl.bestinfra.app";
  } catch {
    return false;
  }
}

export function isStripIndorePrefixEnabled(): boolean {
  try {
    const e = getEnv();
    if (e.STRIP_INDORE_PREFIX) {
      return true;
    }
  } catch {
    // Env not ready / invalid — fall through to process.env + auto-detect.
  }
  const raw = process.env.STRIP_INDORE_PREFIX?.trim().toLowerCase();
  if (raw === "1" || raw === "true" || raw === "yes") {
    return true;
  }
  if (raw === "0" || raw === "false" || raw === "no") {
    return false;
  }
  return shouldAutoStripIndorePrefix();
}

/**
 * GitHub secret BASE_URL sometimes includes `/indore` or `/auth/login`,
 * which doubles the path or 404s. Keep origin only.
 */
export function normalizeApiBaseUrl(raw: string | undefined): string {
  return (raw ?? "")
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/auth\/login$/i, "")
    .replace(/\/indore$/i, "")
    .replace(/\/+$/, "");
}

/**
 * Rewrites API paths/URLs when STRIP_INDORE_PREFIX is enabled.
 * Examples:
 *   /indore/auth/login → /auth/login
 *   http://localhost:3000/indore/master-data/x → http://localhost:3000/master-data/x
 */
export function resolveApiPath(pathOrUrl: string): string {
  if (!isStripIndorePrefixEnabled()) {
    return pathOrUrl;
  }

  const trimmed = pathOrUrl.trim();
  if (!trimmed) {
    return pathOrUrl;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/^(https?:\/\/[^/?#]+)\/indore(?=\/|$)/i, "$1");
  }

  if (trimmed === "/indore") {
    return "/";
  }

  if (trimmed.startsWith("/indore/")) {
    return trimmed.slice("/indore".length);
  }

  // Absolute path missing leading slash variants
  if (trimmed === "indore" || trimmed.startsWith("indore/")) {
    const rest = trimmed.slice("indore".length);
    return rest === "" ? "/" : rest.startsWith("/") ? rest : `/${rest}`;
  }

  return pathOrUrl;
}
