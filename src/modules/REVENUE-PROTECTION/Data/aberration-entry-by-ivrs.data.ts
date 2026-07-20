import { REVENUE_PROTECTION_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { AberrationEntryUpdatePayload } from "../Mapper/aberration-entry-by-ivrs.mapper";

/**
 * Prefer RP_ABERRATION_ENTRY_IVRS. When unset, specs discover an IVRS from
 * the zone list before PATCHing.
 */
export function resolveAberrationEntryKnownIvrs(): string | undefined {
  const fromEnv = process.env.RP_ABERRATION_ENTRY_IVRS?.trim();
  return fromEnv && fromEnv.length > 0 ? fromEnv : undefined;
}

export const aberrationEntryByIvrsMaxResponseTimeMs =
  REVENUE_PROTECTION_MAX_RESPONSE_TIME_MS;

export const aberrationEntryUnknownIvrs = "N0000000000";

export const aberrationEntryNotFoundCode = "ABERRATION_ENTRY_NOT_FOUND";

/** Safe automation payload — required fields must be non-empty strings. */
export function buildAberrationEntryUpdatePayload(
  overrides: Partial<AberrationEntryUpdatePayload> = {},
): AberrationEntryUpdatePayload {
  return {
    remarks: "automation update",
    amountBilled: 100,
    amountRealised: 50,
    mrTransactionNo: "AUTO-MR-001",
    fieldOfficerRemarks: "automation field remarks",
    fieldOfficerName: "Automation Officer",
    fieldOfficerDesignation: "JE",
    p4No: "",
    p4Date: "",
    inspectionDate: "",
    ...overrides,
  };
}

export const aberrationEntryByIvrsTestCases = [
  {
    testCaseId: "IND-REV-ABE-IVRS-001",
    testName:
      "IND-REV-ABE-IVRS-001 — PATCH aberration entry by IVRS returns echoed ivrsNo",
    tags: [
      "@revenue-protection",
      "@aberration-entry-by-ivrs",
      "@positive",
      "@smoke",
    ] as const,
  },
] as const;
