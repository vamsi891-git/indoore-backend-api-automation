import { test, expect } from "@playwright/test";
import { CasesValidator } from "../../Validator/cases.validator";
import type { CasesData } from "../../Mapper/cases.mapper";
import { sampleCasesDataForPagination } from "./fixtures/cases-sample.fixture";

/**
 * Mutation proof: incorrect pagination.totalPages must fail validatePagination.
 * Run manually: npm run test:mutation-proof
 */
test.describe("Mutation proof — pagination math", () => {
  test("MUT-001 — validatePagination fails when totalPages is off-by-one",
    { tag: ["@mutation-proof", "@revenue-protection"] },
    async () => {
      const mutated: CasesData = {
        ...sampleCasesDataForPagination,
        pagination: {
          ...sampleCasesDataForPagination.pagination,
          // Correct would be Math.ceil(25/10) = 3; mutate to 4
          totalPages: 4,
        },
      };
      const validator = new CasesValidator();
      let caught: Error | undefined;
      try {
        validator.validatePagination(mutated);
      } catch (error: unknown) {
        caught = error instanceof Error ? error : new Error(String(error));
      }
      expect(caught, "validatePagination should throw on bad totalPages").toBeDefined();
      const message = caught?.message ?? "";
      expect(message).toMatch(/totalPages|3|4/i);
      expect(message).toMatch(/expected|Received|toEqual|to be/i);
    },
  );
});
