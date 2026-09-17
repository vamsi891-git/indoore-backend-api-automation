import { test, expect } from "@playwright/test";
import { HierarchyChildrenValidator } from "../../Validator/hierarchychildren.validator";
import { HierarchyChildrenSuccessResponseSchema } from "../../schemas/asset-management.schemas";
import { captureThrownMessage } from "./fixtures/capture-throw";
import { sampleHierarchyChildrenSuccess } from "./fixtures/asset-sample.fixture";
import type { HierarchyChildrenData } from "../../Mapper/hierarchychildren.mapper";

test.describe("Mutation proof — Hierarchy children", () => {
  test(
    "MUT-AM-HC-001 — schema fails when type is removed",
    { tag: ["@mutation-proof", "@asset-management", "@hierarchy-children"] },
    async () => {
      const mutated = structuredClone(sampleHierarchyChildrenSuccess);
      delete (mutated.data.items[0] as Record<string, unknown>).type;
      const result = HierarchyChildrenSuccessResponseSchema.safeParse(mutated);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(JSON.stringify(result.error.issues)).toMatch(/type/i);
      }
    },
  );

  test(
    "MUT-AM-HC-002 — schema rejects unexpected item field (.strict())",
    { tag: ["@mutation-proof", "@asset-management", "@hierarchy-children"] },
    async () => {
      const mutated = structuredClone(sampleHierarchyChildrenSuccess);
      (mutated.data.items[0] as Record<string, unknown>).debugFlag = true;
      const result = HierarchyChildrenSuccessResponseSchema.safeParse(mutated);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(JSON.stringify(result.error.issues)).toMatch(
          /debugFlag|unrecognized_keys/i,
        );
      }
    },
  );

  test(
    "MUT-AM-HC-003 — schema rejects childCount as string",
    { tag: ["@mutation-proof", "@asset-management", "@hierarchy-children"] },
    async () => {
      const mutated = structuredClone(sampleHierarchyChildrenSuccess);
      (mutated.data.items[0] as Record<string, unknown>).childCount = "1";
      const result = HierarchyChildrenSuccessResponseSchema.safeParse(mutated);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(JSON.stringify(result.error.issues)).toMatch(/childCount/i);
      }
    },
  );

  test(
    "MUT-AM-HC-004 — validateDuplicateIds fails on duplicate id",
    { tag: ["@mutation-proof", "@asset-management", "@hierarchy-children"] },
    async () => {
      const data: HierarchyChildrenData = structuredClone(
        sampleHierarchyChildrenSuccess.data,
      );
      data.items.push({ ...data.items[0] });
      const message = captureThrownMessage(() =>
        new HierarchyChildrenValidator().validateDuplicateIds(data),
      );
      expect(message).not.toEqual("");
      expect(message).toMatch(/expected|Received|toEqual|size/i);
    },
  );

  test(
    "MUT-AM-HC-005 — validateFields fails when hasChildren does not match childCount",
    { tag: ["@mutation-proof", "@asset-management", "@hierarchy-children"] },
    async () => {
      const data: HierarchyChildrenData = structuredClone(
        sampleHierarchyChildrenSuccess.data,
      );
      data.items[0].hasChildren = false;
      data.items[0].childCount = 1;
      const message = captureThrownMessage(() =>
        new HierarchyChildrenValidator().validateFields(data, "network"),
      );
      expect(message).not.toEqual("");
      expect(message).toMatch(/hasChildren|expected|Received|toEqual/i);
    },
  );

  test(
    "MUT-AM-HC-006 — validatePaginationConsistency fails when totalPages is off-by-one",
    { tag: ["@mutation-proof", "@asset-management", "@hierarchy-children"] },
    async () => {
      const data: HierarchyChildrenData = {
        ...structuredClone(sampleHierarchyChildrenSuccess.data),
        totalPages: 3,
      };
      const message = captureThrownMessage(() =>
        new HierarchyChildrenValidator().validatePaginationConsistency(
          data,
          1,
          20,
        ),
      );
      expect(message).not.toEqual("");
      expect(message).toMatch(/totalPages|2|3|expected|Received/i);
    },
  );

  test(
    "MUT-AM-HC-007 — schema rejects negative id",
    { tag: ["@mutation-proof", "@asset-management", "@hierarchy-children"] },
    async () => {
      const mutated = structuredClone(sampleHierarchyChildrenSuccess);
      mutated.data.items[0].id = -1;
      const result = HierarchyChildrenSuccessResponseSchema.safeParse(mutated);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(JSON.stringify(result.error.issues)).toMatch(/id/i);
      }
    },
  );

  test(
    "MUT-AM-HC-008 — organisation items fail when consumerCount is not null",
    { tag: ["@mutation-proof", "@asset-management", "@hierarchy-children"] },
    async () => {
      const data: HierarchyChildrenData = structuredClone(
        sampleHierarchyChildrenSuccess.data,
      );
      data.items[0].type = "DISCOM";
      data.items[0].consumerCount = 4;
      const message = captureThrownMessage(() =>
        new HierarchyChildrenValidator().validateFields(data, "organisation"),
      );
      expect(message).not.toEqual("");
      expect(message).toMatch(/null|expected|Received/i);
    },
  );
});
