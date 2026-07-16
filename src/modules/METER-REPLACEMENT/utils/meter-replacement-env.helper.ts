/**
 * Runtime fixture serials this suite needs from .env. These must point at real
 * rows in the target environment's DB — there is no seed/factory step here.
 *
 *   METER_REPLACEMENT_OLD_METER_SERIAL          existing, active, assigned meter
 *                                                (used as the "old" meter to replace)
 *   METER_REPLACEMENT_NEW_METER_SERIAL           existing, active, UNASSIGNED meter
 *                                                (used as the replacement meter)
 *   METER_REPLACEMENT_ASSIGNED_NEW_METER_SERIAL  existing meter already assigned to
 *                                                another consumer's service point
 *   METER_REPLACEMENT_INACTIVE_METER_SERIAL      existing meter with IsActiveStatus = false
 *   METER_REPLACEMENT_PENDING_CONSUMER_OLD_SERIAL old meter serial belonging to a
 *                                                consumer who already has a PENDING
 *                                                meter_replacement row
 */
export const METER_REPLACEMENT_ENV_KEYS = [
  "METER_REPLACEMENT_OLD_METER_SERIAL",
  "METER_REPLACEMENT_NEW_METER_SERIAL",
  "METER_REPLACEMENT_ASSIGNED_NEW_METER_SERIAL",
  "METER_REPLACEMENT_INACTIVE_METER_SERIAL",
  "METER_REPLACEMENT_PENDING_CONSUMER_OLD_SERIAL",
] as const;

const METER_REPLACEMENT_FALLBACK_SERIAL_KEYS = [
  "METER_REPLACEMENT_VALIDATE_SERIAL",
  "VALIDATE_DTR_METER_VALID_SERIAL",
  "VALIDATE_ADD_METER_VALID_SERIAL",
] as const;

export function resolveMeterReplacementEnv(key: string): string {
  const directValue = process.env[key]?.trim();
  if (directValue) {
    return directValue;
  }

  // Only fall back for primary old/new serials — special negative fixtures
  // (inactive / assigned / pending) must be set explicitly or the test skips.
  if (
    key === "METER_REPLACEMENT_OLD_METER_SERIAL" ||
    key === "METER_REPLACEMENT_NEW_METER_SERIAL"
  ) {
    for (const fallbackKey of METER_REPLACEMENT_FALLBACK_SERIAL_KEYS) {
      const fallbackValue = process.env[fallbackKey]?.trim();
      if (fallbackValue) {
        return fallbackValue;
      }
    }
  }

  return "";
}

/** Skip when any listed env key resolves empty (no usable fixture). */
export function shouldSkipMeterReplacementTestForEnv(
  envKeys?: string[],
): boolean {
  if (!envKeys?.length) {
    return false;
  }
  return envKeys.some((key) => !resolveMeterReplacementEnv(key));
}
