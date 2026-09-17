import { test, expect } from "@playwright/test";
import { HierarchySearchValidator } from "../../Validator/hierarchysearch.validator";
import { HierarchySearchSuccessResponseSchema } from "../../schemas/asset-management.schemas";
import { captureThrownMessage } from "./fixtures/capture-throw";
import { sampleHierarchySearchSuccess } from "./fixtures/asset-sample.fixture";
import type { HierarchySearchData } from "../../Mapper/hierarchysearch.mapper";

test.describe("Mutation proof — Hierarchy search", () => {
  test(
    "MUT-AM-HS-001 — schema fails when node is removed",
    { tag: ["@mutation-proof", "@asset-management", "@hierarchy-search"] },
    async () => {
      const mutated = structuredClone(sampleHierarchySearchSuccess);
      delete (mutated.data.items[0] as Record<string, unknown>).node;
      const result = HierarchySearchSuccessResponseSchema.safeParse(mutated);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(JSON.stringify(result.error.issues)).toMatch(/node/i);
      }
    },
  );

  test(
    "MUT-AM-HS-002 — schema rejects unexpected item field (.strict())",
    { tag: ["@mutation-proof", "@asset-management", "@hierarchy-search"] },
    async () => {
      const mutated = structuredClone(sampleHierarchySearchSuccess);
      (mutated.data.items[0] as Record<string, unknown>).debugFlag = true;
      const result = HierarchySearchSuccessResponseSchema.safeParse(mutated);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(JSON.stringify(result.error.issues)).toMatch(
          /debugFlag|unrecognized_keys/i,
        );
      }
    },
  );

  test(
    "MUT-AM-HS-003 — schema rejects unexpected ancestor field (.strict())",
    { tag: ["@mutation-proof", "@asset-management", "@hierarchy-search"] },
    async () => {
      const mutated = structuredClone(sampleHierarchySearchSuccess);
      (mutated.data.items[0].ancestors[0] as Record<string, unknown>).debugFlag =
        true;
      const result = HierarchySearchSuccessResponseSchema.safeParse(mutated);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(JSON.stringify(result.error.issues)).toMatch(
          /debugFlag|unrecognized_keys/i,
        );
      }
    },
  );

  test(
    "MUT-AM-HS-004 — schema fails when ancestors is missing",
    { tag: ["@mutation-proof", "@asset-management", "@hierarchy-search"] },
    async () => {
      const mutated = structuredClone(sampleHierarchySearchSuccess);
      delete (mutated.data.items[0] as Record<string, unknown>).ancestors;
      const result = HierarchySearchSuccessResponseSchema.safeParse(mutated);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(JSON.stringify(result.error.issues)).toMatch(/ancestors/i);
      }
    },
  );

  test(
    "MUT-AM-HS-005 — validateSearchMatch fails when name and code miss q",
    { tag: ["@mutation-proof", "@asset-management", "@hierarchy-search"] },
    async () => {
      const data: HierarchySearchData = structuredClone(
        sampleHierarchySearchSuccess.data,
      );
      const message = captureThrownMessage(() =>
        new HierarchySearchValidator().validateSearchMatch(data, "ZZZNOHIT"),
      );
      expect(message).not.toEqual("");
      expect(message).toMatch(/should match|expected|Received|toBe/i);
    },
  );

  test(
    "MUT-AM-HS-006 — validateAncestors fails when last ancestor is not parentId",
    { tag: ["@mutation-proof", "@asset-management", "@hierarchy-search"] },
    async () => {
      const data: HierarchySearchData = structuredClone(
        sampleHierarchySearchSuccess.data,
      );
      data.items[0].ancestors[data.items[0].ancestors.length - 1].id = 999;
      const message = captureThrownMessage(() =>
        new HierarchySearchValidator().validateAncestors(data),
      );
      expect(message).not.toEqual("");
      expect(message).toMatch(/parentId|expected|Received|toEqual/i);
    },
  );

  test(
    "MUT-AM-HS-007 — validatePaginationConsistency fails when totalPages is off-by-one",
    { tag: ["@mutation-proof", "@asset-management", "@hierarchy-search"] },
    async () => {
      const data: HierarchySearchData = {
        ...structuredClone(sampleHierarchySearchSuccess.data),
        totalPages: 3,
      };
      const message = captureThrownMessage(() =>
        new HierarchySearchValidator().validatePaginationConsistency(
          data,
          1,
          20,
        ),
      );
      expect(message).not.toEqual("");
      expect(message).toMatch(/totalPages|1|3|expected|Received/i);
    },
  );

  test(
    "MUT-AM-HS-008 — schema rejects blank ancestor name",
    { tag: ["@mutation-proof", "@asset-management", "@hierarchy-search"] },
    async () => {
      const mutated = structuredClone(sampleHierarchySearchSuccess);
      mutated.data.items[0].ancestors[0].name = "   ";
      const result = HierarchySearchSuccessResponseSchema.safeParse(mutated);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(JSON.stringify(result.error.issues)).toMatch(/name/i);
      }
    },
  );

  test(
    "MUT-AM-HS-009 — validateDuplicateIds fails on duplicate node id",
    { tag: ["@mutation-proof", "@asset-management", "@hierarchy-search"] },
    async () => {
      const data: HierarchySearchData = structuredClone(
        sampleHierarchySearchSuccess.data,
      );
      data.items.push({ ...data.items[0] });
      const message = captureThrownMessage(() =>
        new HierarchySearchValidator().validateDuplicateIds(data),
      );
      expect(message).not.toEqual("");
      expect(message).toMatch(/expected|Received|toEqual|size/i);
    },
  );

  test(
    "MUT-AM-HS-010 — organisation search fails when consumerCount is not null",
    { tag: ["@mutation-proof", "@asset-management", "@hierarchy-search"] },
    async () => {
      const data: HierarchySearchData = structuredClone(
        sampleHierarchySearchSuccess.data,
      );
      data.items[0].node.consumerCount = 4;
      const message = captureThrownMessage(() =>
        new HierarchySearchValidator().validateFields(data, "organisation"),
      );
      expect(message).not.toEqual("");
      expect(message).toMatch(/null|expected|Received/i);
    },
  );
});
