/**
 * Shared try/catch helper for mutation-proof specs.
 */
export function captureThrownMessage(fn: () => void): string {
  try {
    fn();
    return "";
  } catch (error: unknown) {
    return error instanceof Error ? error.message : String(error);
  }
}
