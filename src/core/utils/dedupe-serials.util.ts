/**
 * Dedupe meter serial numbers before they are sent as comma-separated query params
 * or used in request bodies. Prevents duplicate-key failures on temp-table inserts
 * when the caller accidentally repeats the same serial.
 */
export function dedupeMeterSerials(
  serials: readonly string[],
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of serials) {
    const serial = raw.trim();
    if (!serial || seen.has(serial)) {
      continue;
    }
    seen.add(serial);
    result.push(serial);
  }

  return result;
}

export function formatMeterSerialsQueryParam(
  serials: readonly string[],
): string | undefined {
  const unique = dedupeMeterSerials(serials);
  return unique.length > 0 ? unique.join(",") : undefined;
}
