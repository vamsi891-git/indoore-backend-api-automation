import { test, expect } from "@playwright/test";
import { TechnicalReportSuccessResponseSchema } from "../../schemas/technical-analysis.schemas";
import { collectTechnicalAnalysisDataQualityFindings } from "../../Db/technical-analysis-db.validator";
import { sampleTechnicalReportSuccess } from "./fixtures/technical-sample.fixture";
import { TechnicalReportValidator } from "../../Validator/technical-analysis.shared";

test.describe("Mutation proof — Technical Report", () => {
  test(
    "MUT-TA-RPT-001 — schema rejects missing rows",
    { tag: ["@mutation-proof", "@technical-analysis"] },
    async () => {
      const mutated = structuredClone(sampleTechnicalReportSuccess);
      delete (mutated.data as Record<string, unknown>).rows;
      expect(
        TechnicalReportSuccessResponseSchema.safeParse(mutated).success,
      ).toBe(false);
    },
  );

  test(
    "MUT-TA-RPT-002 — schema rejects unexpected root field (.strict())",
    { tag: ["@mutation-proof", "@technical-analysis"] },
    async () => {
      const mutated = structuredClone(sampleTechnicalReportSuccess);
      (mutated as Record<string, unknown>).extraField = true;
      expect(
        TechnicalReportSuccessResponseSchema.safeParse(mutated).success,
      ).toBe(false);
    },
  );

  test(
    "MUT-TA-RPT-003 — schema rejects meterLookupId = -1",
    { tag: ["@mutation-proof", "@technical-analysis"] },
    async () => {
      const mutated = structuredClone(sampleTechnicalReportSuccess);
      mutated.data.rows[0].meterLookupId = -1;
      expect(
        TechnicalReportSuccessResponseSchema.safeParse(mutated).success,
      ).toBe(false);
    },
  );

  test(
    "MUT-TA-RPT-004 — schema rejects page = 0",
    { tag: ["@mutation-proof", "@technical-analysis"] },
    async () => {
      const mutated = structuredClone(sampleTechnicalReportSuccess);
      mutated.data.pagination.page = 0;
      expect(
        TechnicalReportSuccessResponseSchema.safeParse(mutated).success,
      ).toBe(false);
    },
  );

  test(
    "MUT-TA-RPT-005 — data-quality flags blank IVRS on row",
    { tag: ["@mutation-proof", "@technical-analysis"] },
    async () => {
      const mutated = structuredClone(sampleTechnicalReportSuccess.data);
      mutated.rows[0].ivrsNumber = "";
      const report = collectTechnicalAnalysisDataQualityFindings(
        "report",
        mutated,
      );
      expect(report.warnings.length + report.counts.emptyIvrs).toBeGreaterThan(
        0,
      );
    },
  );

  test(
    "MUT-TA-RPT-006 — same meter on two DTRs is allowed; same meter and DTR is a duplicate",
    { tag: ["@mutation-proof", "@technical-analysis"] },
    async () => {
      const validator = new TechnicalReportValidator();
      const base = sampleTechnicalReportSuccess.data.rows[0];
      validator.validateDuplicateContract([
        { ...base, dtr: "DTR-A" },
        { ...base, dtr: "DTR-B" },
      ]);
      expect(() =>
        validator.validateDuplicateContract([
          { ...base, dtr: "DTR-A" },
          { ...base, dtr: "DTR-A" },
        ]),
      ).toThrow();
    },
  );
});
