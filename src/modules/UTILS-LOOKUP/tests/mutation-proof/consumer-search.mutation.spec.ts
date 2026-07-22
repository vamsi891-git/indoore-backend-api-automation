import { test, expect } from "@playwright/test";
import { SearchConsumerValidator } from "../../Validator/consumersearch.validator";
import { ConsumerSearchSuccessResponseSchema } from "../../schemas/consumer-search.schemas";
import { captureThrownMessage } from "./fixtures/capture-throw";
import {
  sampleConsumerSearchData,
  sampleConsumerSearchSuccess,
} from "./fixtures/consumer-search.fixture";

test.describe("Mutation proof — Consumer search", () => {
  test(
    "MUT-UL-CS-001 — validatePagination fails when totalPages is off-by-one",
    { tag: ["@mutation-proof", "@utils-lookup", "@consumer-search"] },
    async () => {
      const mutated = {
        ...sampleConsumerSearchData,
        totalPages: 4,
      };
      const message = captureThrownMessage(() =>
        new SearchConsumerValidator().validatePagination(mutated),
      );
      expect(message).not.toEqual("");
      expect(message).toMatch(/3|4|expected|Received/i);
    },
  );

  test(
    "MUT-UL-CS-002 — schema rejects unexpected item field (.strict())",
    { tag: ["@mutation-proof", "@utils-lookup", "@consumer-search"] },
    async () => {
      const mutated = structuredClone(sampleConsumerSearchSuccess);
      (mutated.data.items[0] as Record<string, unknown>).debugFlag = true;
      const result = ConsumerSearchSuccessResponseSchema.safeParse(mutated);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(JSON.stringify(result.error.issues)).toMatch(
          /debugFlag|unrecognized_keys/i,
        );
      }
    },
  );

  test(
    "MUT-UL-CS-003 — schema fails when meterSerialNumber is removed",
    { tag: ["@mutation-proof", "@utils-lookup", "@consumer-search"] },
    async () => {
      const mutated = structuredClone(sampleConsumerSearchSuccess);
      delete (mutated.data.items[0] as Record<string, unknown>)
        .meterSerialNumber;
      const result = ConsumerSearchSuccessResponseSchema.safeParse(mutated);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(JSON.stringify(result.error.issues)).toMatch(
          /meterSerialNumber/,
        );
      }
    },
  );
});
