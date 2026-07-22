import { test, expect } from "@playwright/test";
import { AberrationsValidator } from "../../Validator/aberrations.validator";
import type { AberrationsData } from "../../Mapper/aberrations.mapper";
import { AberrationsSuccessResponseSchema } from "../../schemas/revenue-protection.schemas";
import { captureThrownMessage } from "./fixtures/capture-throw";
import {
  sampleAberrationsDataForPagination,
  sampleAberrationsSuccessResponse,
  sampleAberrationRow,
} from "./fixtures/aberrations-sample.fixture";
/**
 * Lightweight mutation proof — Aberrations summary
 * GET /indore/revenue-protection/aberrations
 *
 * Note: AberrationSummaryRowSchema uses .passthrough() (not .strict()).
 * Extra-field rejection is therefore NOT claimed here — we prove pagination
 * math, case-count consistency, and required-field presence instead.
 */
test.describe("Mutation proof — Aberrations", () => {
  test("MUT-ABE-001 — validatePagination fails when totalPages is off-by-one",
    { tag: ["@mutation-proof", "@revenue-protection", "@aberrations"] },
    async () => {
      const mutated: AberrationsData = {
        ...sampleAberrationsDataForPagination,
        pagination: {
          ...sampleAberrationsDataForPagination.pagination,
          totalPages: 4,
        },
      };
      const message = captureThrownMessage(() =>
        new AberrationsValidator().validatePagination(mutated),
      );
      expect(message).not.toEqual("");
      expect(message).toMatch(/3|4|expected|Received/i);
    },
  );
  test("MUT-ABE-002 — validateCaseCountConsistency fails when attended+pending ≠ noOfCases",
    { tag: ["@mutation-proof", "@revenue-protection", "@aberrations"] },
    async () => {
      const mutated: AberrationsData = {
        columns: sampleAberrationsSuccessResponse.data.columns,
        rows: [
          {
            ...sampleAberrationRow,
            noOfCases: 10,
            totalCasesAttended: 7,
            pending: 1, // should be 3
          },
        ],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      };
      const message = captureThrownMessage(() =>
        new AberrationsValidator().validateCaseCountConsistency(mutated),
      );
      expect(message).not.toEqual("");
      expect(message).toMatch(/10|8|7|1|expected|Received|toEqual/i);
    },
  );
  test("MUT-ABE-003 — schema fails when amountBilled is removed",
    { tag: ["@mutation-proof", "@revenue-protection", "@aberrations"] },
    async () => {
      const mutated = structuredClone(sampleAberrationsSuccessResponse);
      delete (mutated.data.rows[0] as Record<string, unknown>).amountBilled;
      const result = AberrationsSuccessResponseSchema.safeParse(mutated);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(JSON.stringify(result.error.issues)).toMatch(/amountBilled/);
      }
    },
  );
});
