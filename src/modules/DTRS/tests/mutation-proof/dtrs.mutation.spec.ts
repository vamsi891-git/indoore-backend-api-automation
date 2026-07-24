import { test, expect } from "@playwright/test";
import {
  DtrsSuccessResponseSchema,
  DtrsListSuccessResponseSchema,
} from "../../schemas/dtrs.schemas";
import { collectDtrsDataQualityFindings } from "../../Db/dtrs-db.validator";
import { sampleDtrsSuccess } from "./fixtures/dtrs-sample.fixture";

test.describe("Mutation proof — DTRS", () => {
  test(
    "MUT-DTRS-001 — schema rejects success false",
    { tag: ["@mutation-proof", "@dtrs"] },
    async () => {
      const mutated = structuredClone(sampleDtrsSuccess);
      (mutated as Record<string, unknown>).success = false;
      expect(DtrsSuccessResponseSchema.safeParse(mutated).success).toBe(false);
    },
  );

  test(
    "MUT-DTRS-002 — schema rejects unexpected root field",
    { tag: ["@mutation-proof", "@dtrs"] },
    async () => {
      const mutated = structuredClone(sampleDtrsSuccess);
      (mutated as Record<string, unknown>).extraField = true;
      expect(DtrsSuccessResponseSchema.safeParse(mutated).success).toBe(false);
    },
  );

  test(
    "MUT-DTRS-003 — list schema accepts fixture",
    { tag: ["@mutation-proof", "@dtrs"] },
    async () => {
      expect(DtrsListSuccessResponseSchema.safeParse(sampleDtrsSuccess).success).toBe(
        true,
      );
    },
  );

  test(
    "MUT-DTRS-004 — DQ flags blank name",
    { tag: ["@mutation-proof", "@dtrs"] },
    async () => {
      const mutated = structuredClone(sampleDtrsSuccess.data);
      mutated.items[0].name = "";
      const report = collectDtrsDataQualityFindings(
        "list",
        mutated as unknown as Record<string, unknown>,
      );
      expect(report.warnings.length + report.counts.emptyName).toBeGreaterThan(0);
    },
  );
});
