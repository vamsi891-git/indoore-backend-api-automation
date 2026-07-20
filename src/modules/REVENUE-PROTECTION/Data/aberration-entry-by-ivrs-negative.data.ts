import { buildAberrationEntryUpdatePayload } from "./aberration-entry-by-ivrs.data";
import { aberrationEntryUnknownIvrs } from "./aberration-entry-by-ivrs.data";

export const aberrationEntryByIvrsNegativeCases = [
  {
    testCaseId: "IND-REV-ABE-IVRS-NEG-001",
    testName: "IND-REV-ABE-IVRS-NEG-001 — Unknown IVRS returns not found",
    tags: [
      "@revenue-protection",
      "@aberration-entry-by-ivrs",
      "@negative",
    ] as const,
    ivrsNo: aberrationEntryUnknownIvrs,
    payload: buildAberrationEntryUpdatePayload(),
    expectedStatuses: [404] as const,
    expectedErrorCode: "ABERRATION_ENTRY_NOT_FOUND",
    outcome: "hard-reject" as const,
  },
  {
    testCaseId: "IND-REV-ABE-IVRS-NEG-002",
    testName: "IND-REV-ABE-IVRS-NEG-002 — Missing required fields",
    tags: [
      "@revenue-protection",
      "@aberration-entry-by-ivrs",
      "@negative",
    ] as const,
    /** Resolved at runtime from zone list when empty. */
    ivrsNo: "",
    payload: { remarks: "only-remarks" } as Record<string, unknown>,
    expectedStatuses: [400] as const,
    expectedErrorCode: "VALIDATION_ERROR",
    outcome: "hard-reject" as const,
  },
  {
    testCaseId: "IND-REV-ABE-IVRS-NEG-003",
    testName: "IND-REV-ABE-IVRS-NEG-003 — Empty required field-officer name",
    tags: [
      "@revenue-protection",
      "@aberration-entry-by-ivrs",
      "@negative",
    ] as const,
    ivrsNo: "",
    payload: buildAberrationEntryUpdatePayload({
      fieldOfficerName: "",
    }),
    expectedStatuses: [400] as const,
    expectedErrorCode: "VALIDATION_ERROR",
    outcome: "hard-reject" as const,
  },
] as const;
