import { test, expect } from "@playwright/test";
import { HierarchyTypesValidator } from "../../Validator/hierarchytypes.validator";
import { HierarchyTypesSuccessResponseSchema } from "../../schemas/asset-management.schemas";
import { captureThrownMessage } from "./fixtures/capture-throw";
import { sampleHierarchyTypesSuccess } from "./fixtures/asset-sample.fixture";
import type { HierarchyTypesData } from "../../Mapper/hierarchytypes.mapper";

test.describe("Mutation proof — Hierarchy types", () => {
  test(
    "MUT-AM-HT-001 — schema fails when type is removed",
    { tag: ["@mutation-proof", "@asset-management", "@hierarchy-types"] },
    async () => {
      const mutated = structuredClone(sampleHierarchyTypesSuccess);
      delete (mutated.data.items[0] as Record<string, unknown>).type;
      const result = HierarchyTypesSuccessResponseSchema.safeParse(mutated);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(JSON.stringify(result.error.issues)).toMatch(/type/i);
      }
    },
  );

  test(
    "MUT-AM-HT-002 — schema rejects unexpected item field (.strict())",
    { tag: ["@mutation-proof", "@asset-management", "@hierarchy-types"] },
    async () => {
      const mutated = structuredClone(sampleHierarchyTypesSuccess);
      (mutated.data.items[0] as Record<string, unknown>).debugFlag = true;
      const result = HierarchyTypesSuccessResponseSchema.safeParse(mutated);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(JSON.stringify(result.error.issues)).toMatch(
          /debugFlag|unrecognized_keys/i,
        );
      }
    },
  );

  test(
    "MUT-AM-HT-003 — schema rejects filterable as string",
    { tag: ["@mutation-proof", "@asset-management", "@hierarchy-types"] },
    async () => {
      const mutated = structuredClone(sampleHierarchyTypesSuccess);
      (mutated.data.items[0] as Record<string, unknown>).filterable = "true";
      const result = HierarchyTypesSuccessResponseSchema.safeParse(mutated);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(JSON.stringify(result.error.issues)).toMatch(/filterable/i);
      }
    },
  );

  test(
    "MUT-AM-HT-004 — validateDuplicateIds fails on duplicate id",
    { tag: ["@mutation-proof", "@asset-management", "@hierarchy-types"] },
    async () => {
      const data: HierarchyTypesData = structuredClone(
        sampleHierarchyTypesSuccess.data,
      );
      data.items[1].id = data.items[0].id;
      const message = captureThrownMessage(() =>
        new HierarchyTypesValidator().validateDuplicateIds(data),
      );
      expect(message).not.toEqual("");
      expect(message).toMatch(/expected|Received|toEqual|size/i);
    },
  );

  test(
    "MUT-AM-HT-005 — validateExpectedTypes fails when Feeder is missing",
    { tag: ["@mutation-proof", "@asset-management", "@hierarchy-types"] },
    async () => {
      const data: HierarchyTypesData = structuredClone(
        sampleHierarchyTypesSuccess.data,
      );
      data.items = data.items.filter((item) => item.type !== "FEEDER");
      const message = captureThrownMessage(() =>
        new HierarchyTypesValidator().validateExpectedTypes(data, "network"),
      );
      expect(message).not.toEqual("");
      expect(message).toMatch(/FEEDER|toContain|expected|Received/i);
    },
  );

  test(
    "MUT-AM-HT-006 — validateFields fails when order is off-by-one",
    { tag: ["@mutation-proof", "@asset-management", "@hierarchy-types"] },
    async () => {
      const data: HierarchyTypesData = structuredClone(
        sampleHierarchyTypesSuccess.data,
      );
      data.items[0].order = 2;
      const message = captureThrownMessage(() =>
        new HierarchyTypesValidator().validateFields(data),
      );
      expect(message).not.toEqual("");
      expect(message).toMatch(/order|expected|Received|toEqual/i);
    },
  );

  test(
    "MUT-AM-HT-007 — validateFields fails when SUB_STATION is not filterable",
    { tag: ["@mutation-proof", "@asset-management", "@hierarchy-types"] },
    async () => {
      const data: HierarchyTypesData = structuredClone(
        sampleHierarchyTypesSuccess.data,
      );
      data.items[0].filterable = false;
      const message = captureThrownMessage(() =>
        new HierarchyTypesValidator().validateFields(data),
      );
      expect(message).not.toEqual("");
      expect(message).toMatch(/filterable|expected|Received|toEqual/i);
    },
  );

  test(
    "MUT-AM-HT-008 — schema rejects blank name",
    { tag: ["@mutation-proof", "@asset-management", "@hierarchy-types"] },
    async () => {
      const mutated = structuredClone(sampleHierarchyTypesSuccess);
      mutated.data.items[0].name = "   ";
      const result = HierarchyTypesSuccessResponseSchema.safeParse(mutated);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(JSON.stringify(result.error.issues)).toMatch(/name/i);
      }
    },
  );
});
