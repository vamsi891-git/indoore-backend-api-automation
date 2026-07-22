import { test, expect } from "@playwright/test";
import { DtrSearchValidator } from "../../Validator/dtrsearch.validator";
import { DtrSearchSuccessResponseSchema } from "../../schemas/dtr-search.schemas";
import { captureThrownMessage } from "./fixtures/capture-throw";
import {
  sampleDtrSearchData,
  sampleDtrSearchSuccess,
} from "./fixtures/dtr-search.fixture";

test.describe("Mutation proof — DTR search", () => {
  test(
    "MUT-UL-DTR-001 — validatePagination fails when totalPages is off-by-one",
    { tag: ["@mutation-proof", "@utils-lookup", "@dtr-search"] },
    async () => {
      const mutated = {
        ...sampleDtrSearchData,
        totalPages: 4,
      };
      const message = captureThrownMessage(() =>
        new DtrSearchValidator().validatePagination(mutated),
      );
      expect(message).not.toEqual("");
      expect(message).toMatch(/3|4|expected|Received/i);
    },
  );

  test(
    "MUT-UL-DTR-002 — schema rejects unexpected item field (.strict())",
    { tag: ["@mutation-proof", "@utils-lookup", "@dtr-search"] },
    async () => {
      const mutated = structuredClone(sampleDtrSearchSuccess);
      (mutated.data.item[0] as Record<string, unknown>).debugFlag = true;
      const result = DtrSearchSuccessResponseSchema.safeParse(mutated);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(JSON.stringify(result.error.issues)).toMatch(
          /debugFlag|unrecognized_keys/i,
        );
      }
    },
  );

  test(
    "MUT-UL-DTR-003 — schema fails when dtrCode is removed",
    { tag: ["@mutation-proof", "@utils-lookup", "@dtr-search"] },
    async () => {
      const mutated = structuredClone(sampleDtrSearchSuccess);
      delete (mutated.data.item[0] as Record<string, unknown>).dtrCode;
      const result = DtrSearchSuccessResponseSchema.safeParse(mutated);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(JSON.stringify(result.error.issues)).toMatch(/dtrCode/);
      }
    },
  );
});
