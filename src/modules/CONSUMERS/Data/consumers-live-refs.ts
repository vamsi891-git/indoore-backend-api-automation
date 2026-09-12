/**
 * Known-good local/dev consumer for profile, activation, billing, graphs,
 * and event-log widgets.
 *
 * 1019258045 resolves for RTP/PQ/LLP but 404s on profile/activation/comm-status.
 * 3543025952 is the billing-period sample and resolves across those routes.
 */
export const CONSUMERS_LIVE_IVRS = "3543025952";
export const CONSUMERS_LIVE_ACCOUNT_ID = "3543025952";
/** L_Meter_Lookup id for CONSUMERS_LIVE_IVRS. */
export const CONSUMERS_LIVE_METER_ROUTE = "meter-134319";

function firstRef(...values: Array<string | undefined>): string | undefined {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) {
      return trimmed;
    }
  }
  return undefined;
}

export function resolveLiveIvrs(
  ...preferred: Array<string | undefined>
): string {
  return firstRef(...preferred, CONSUMERS_LIVE_IVRS)!;
}

export function resolveLiveAccountId(
  ...preferred: Array<string | undefined>
): string {
  return firstRef(...preferred, CONSUMERS_LIVE_ACCOUNT_ID)!;
}

export function resolveLiveMeterRoute(
  ...preferred: Array<string | undefined>
): string {
  return firstRef(...preferred, CONSUMERS_LIVE_METER_ROUTE)!;
}
