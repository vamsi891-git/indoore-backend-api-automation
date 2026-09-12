/**
 * Local backend often mounts routes at `/auth/...` (API_BASE_PATH empty).
 * Live mounts under `/indore/...`. Set STRIP_INDORE_PREFIX=true in `.env`
 * to rewrite `/indore/...` → `/...` for local testing without editing every API file.
 */
export function enableStripIndorePrefix(): void {
  const raw = process.env.STRIP_INDORE_PREFIX?.trim().toLowerCase();
  if (raw === "0" || raw === "false" || raw === "no") {
    return;
  }
  process.env.STRIP_INDORE_PREFIX = "true";
}

function shouldAutoStripIndorePrefix(): boolean {
  try {
    const host = new URL(normalizeApiBaseUrl(process.env.BASE_URL)).hostname;
    return host === "api.mdm.mppkvvcl.bestinfra.app";
  } catch {
    return false;
  }
}

export function isStripIndorePrefixEnabled(): boolean {
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
