export interface CreateSubmissionRequestBody {
  consumerId: number;
  oldMeterLookupId: number;
  oldMeterSerial: string;
  oldMeterReading: number;
  newMeterLookupId: number;
  newMeterSerial: string;
  newMeterReading: number;
  replacementReason: string;
  remarks?: string;
  latitude: number;
  longitude: number;
}

/** Prefer env when a known eligible consumer is reserved for automation. */
export function resolvePreferredEligibleConsumerId(): number | null {
  const raw =
    process.env.METER_REPLACEMENT_ELIGIBLE_CONSUMER_ID?.trim() ||
    process.env.METER_REPLACEMENT_CONSUMER_ID?.trim() ||
    "";
  if (!raw) return null;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export const createSubmissionData = {
  /**
   * Fallback scan order when env preferred id is missing/ineligible.
   * Prefer higher IDs — lower ones are often exhausted by prior PENDING submissions.
   */
  eligibleConsumerCandidates: [
    5200, 5100, 5000, 4900, 4800, 4700, 4600, 4500, 4400, 4300, 4200, 4100,
    4000, 3900, 3800, 3700, 3600, 3500, 3400, 3300, 3200, 3100, 3000, 2900,
    2800, 2700, 2600, 2500, 2200, 2000, 1900, 1800, 1700, 1600, 1500, 1400,
    1300, 1200, 1100, 1064, 900, 800, 500, 100, 55,
  ],

  /** Consumer known to have an active PENDING replacement after prior runs. */
  ineligibleConsumerId: 1200,

  invalidConsumerId: 99_999_999,

  zeroIdsPayload: {
    consumerId: 0,
    oldMeterLookupId: 0,
    oldMeterSerial: "string",
    oldMeterReading: 0,
    newMeterLookupId: 0,
    newMeterSerial: "string",
    newMeterReading: 0,
    replacementReason: "string",
    remarks: "string",
    latitude: 0,
    longitude: 0,
  } satisfies CreateSubmissionRequestBody,

  unknownNewMeterSerial: "NOTEXIST_MR_999999",
  mismatchedOldMeterSerial: "WRONG_OLD_SERIAL_999",

  /** New meter already used in an active PENDING replacement (from prior probes). */
  activeReplacementNewMeter: {
    newMeterLookupId: 143_936,
    newMeterSerial: "CM4029891545",
  },

  defaultOldMeterReading: 1234.5,
  defaultNewMeterReading: 0,
  defaultReplacementReason: "Smart Meter Upgrade",
  defaultRemarks: "automation create-submission",

  defaultLatitude: 22.7196,
  defaultLongitude: 75.8577,

  expectedSuccessStatus: 201,
  expectedPendingStatus: "PENDING",
  /** Live create may auto-complete; accept either terminal create status. */
  expectedCreatedStatuses: ["PENDING", "COMPLETED"] as const,

  maxResponseTime: 60_000,

  invalidBearerToken: "Bearer invalid.token.value",
  malformedBearerToken: "not-a-bearer-token",
  emptyBearerToken: "Bearer ",
};

export function buildCreateSubmissionPayload(
  partial: Partial<CreateSubmissionRequestBody> &
    Pick<
      CreateSubmissionRequestBody,
      | "consumerId"
      | "oldMeterLookupId"
      | "oldMeterSerial"
      | "newMeterLookupId"
      | "newMeterSerial"
    >,
): CreateSubmissionRequestBody {
  return {
    consumerId: partial.consumerId,
    oldMeterLookupId: partial.oldMeterLookupId,
    oldMeterSerial: partial.oldMeterSerial,
    oldMeterReading:
      partial.oldMeterReading ?? createSubmissionData.defaultOldMeterReading,
    newMeterLookupId: partial.newMeterLookupId,
    newMeterSerial: partial.newMeterSerial,
    newMeterReading:
      partial.newMeterReading ?? createSubmissionData.defaultNewMeterReading,
    replacementReason:
      partial.replacementReason ?? createSubmissionData.defaultReplacementReason,
    remarks: partial.remarks ?? createSubmissionData.defaultRemarks,
    latitude: partial.latitude ?? createSubmissionData.defaultLatitude,
    longitude: partial.longitude ?? createSubmissionData.defaultLongitude,
  };
}
