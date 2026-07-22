import { test, expect } from "@playwright/test";
import { AberrationEntryValidator } from "../../Validator/aberration-entry.validator";
import type { AberrationEntryData } from "../../Mapper/aberration-entry.mapper";
import { AberrationEntrySuccessResponseSchema } from "../../schemas/aberration-entry.schemas";
import { captureThrownMessage } from "./fixtures/capture-throw";
import {
  sampleAberrationEntryDataForPagination,
  sampleAberrationEntrySuccessResponse,
} from "./fixtures/aberration-entry-sample.fixture";
/**
 * Lightweight mutation proof — Aberration Entry (zone)
 * GET /indore/revenue-protection/aberration-entry/zone
 */
test.describe("Mutation proof — Aberration Entry zone", () => {
  test("MUT-ABE-ENTRY-001 — validatePagination fails when totalPages is off-by-one",
    { tag: ["@mutation-proof", "@revenue-protection", "@aberration-entry"] },
    async () => {
      const mutated: AberrationEntryData = {
        ...sampleAberrationEntryDataForPagination,
        pagination: {
          ...sampleAberrationEntryDataForPagination.pagination,
          totalPages: 4,
        },
      };
      const message = captureThrownMessage(() =>
        new AberrationEntryValidator().validatePagination(mutated),
      );
      expect(message).not.toEqual("");
      expect(message).toMatch(/3|4|expected|Received/i);
    },
  );

  test("MUT-ABE-ENTRY-002 — schema rejects unexpected row field (.strict())",
    { tag: ["@mutation-proof", "@revenue-protection", "@aberration-entry"] },
    async () => {
      const mutated = structuredClone(sampleAberrationEntrySuccessResponse);
      (mutated.data.rows[0] as Record<string, unknown>).debugFlag = true;
      const result = AberrationEntrySuccessResponseSchema.safeParse(mutated);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(JSON.stringify(result.error.issues)).toMatch(
          /debugFlag|unrecognized_keys/i,
        );
      }
    },
  );

  test("MUT-ABE-ENTRY-003 — schema fails when amountBilled is removed",
    { tag: ["@mutation-proof", "@revenue-protection", "@aberration-entry"] },
    async () => {
      const mutated = structuredClone(sampleAberrationEntrySuccessResponse);
      delete (mutated.data.rows[0] as Record<string, unknown>).amountBilled;
      const result = AberrationEntrySuccessResponseSchema.safeParse(mutated);
      expect(result.success).toBe(false);
      if (!result.success) {
        const text = JSON.stringify(result.error.issues);
        expect(text).toMatch(/amountBilled/);
        expect(text).toMatch(/invalid_type|required/i);
      }
    },
  );
});
