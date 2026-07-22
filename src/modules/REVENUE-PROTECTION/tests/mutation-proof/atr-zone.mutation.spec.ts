import { test, expect } from "@playwright/test";
import { AtrZoneValidator } from "../../Validator/atr-zone.validator";
import type { AtrZoneData } from "../../Mapper/atr-zone.mapper";
import { AtrZoneSuccessResponseSchema } from "../../schemas/atr-zone.schemas";
import { captureThrownMessage } from "./fixtures/capture-throw";
import {
  sampleAtrZoneDataForPagination,
  sampleAtrZoneSuccessResponse,
} from "./fixtures/atr-zone-sample.fixture";
/**
 * Lightweight mutation proof — ATR Zone
 * GET /indore/revenue-protection/atr-zone
 */
test.describe("Mutation proof — ATR Zone", () => {
  test("MUT-ATZ-001 — validatePagination fails when totalPages is off-by-one",
    { tag: ["@mutation-proof", "@revenue-protection", "@atr-zone"] },
    async () => {
      const mutated: AtrZoneData = {
        ...sampleAtrZoneDataForPagination,
        pagination: {
          ...sampleAtrZoneDataForPagination.pagination,
          totalPages: 4,
        },
      };
      const message = captureThrownMessage(() =>
        new AtrZoneValidator().validatePagination(mutated),
      );
      expect(message).not.toEqual("");
      expect(message).toMatch(/3|4|expected|Received/i);
    },
  );
  test("MUT-ATZ-002 — AtrZoneSuccessResponseSchema rejects unexpected row field",
    { tag: ["@mutation-proof", "@revenue-protection", "@atr-zone"] },
    async () => {
      const mutated = structuredClone(sampleAtrZoneSuccessResponse);
      (mutated.data.rows[0] as Record<string, unknown>).debugFlag = true;
      const result = AtrZoneSuccessResponseSchema.safeParse(mutated);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(JSON.stringify(result.error.issues)).toMatch(
          /debugFlag|unrecognized_keys/i,
        );
      }
    },
  );
  test("MUT-ATZ-003 — schema fails when amountBilled is removed",
    { tag: ["@mutation-proof", "@revenue-protection", "@atr-zone"] },
    async () => {
      const mutated = structuredClone(sampleAtrZoneSuccessResponse);
      delete (mutated.data.rows[0] as Record<string, unknown>).amountBilled;
      const result = AtrZoneSuccessResponseSchema.safeParse(mutated);
      expect(result.success).toBe(false);
      if (!result.success) {
        const text = JSON.stringify(result.error.issues);
        expect(text).toMatch(/amountBilled/);
        expect(text).toMatch(/invalid_type|required/i);
      }
    },
  );
});
