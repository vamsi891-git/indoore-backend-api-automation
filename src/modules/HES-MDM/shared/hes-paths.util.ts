/**
 * Resolves API paths against HES_BASE_URL.
 * Doc base: https://servername/sma/ws — endpoints are /meterJob, /queryMeterJob, etc.
 */
export function hesApiPath(endpoint: string): string {
  const normalized = endpoint.replace(/^\//, "");
  const base = (process.env.HES_BASE_URL ?? "").replace(/\/$/, "");

  if (base.endsWith("/sma/ws")) {
    return `/${normalized}`;
  }

  return `/sma/ws/${normalized}`;
}
