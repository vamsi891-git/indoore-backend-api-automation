import { test, expect } from "@playwright/test";
import { NetworkHierarchyValidator } from "../../Validator/networkhierarchy.validator";
import { NetworkHierarchySuccessResponseSchema } from "../../schemas/asset-management.schemas";
import { captureThrownMessage } from "./fixtures/capture-throw";
import { sampleNetworkHierarchySuccess } from "./fixtures/asset-sample.fixture";
import type { NetworkNode } from "../../Mapper/networkhierarchy.mapper";

test.describe("Mutation proof — Network hierarchy", () => {
  test(
    "MUT-AM-NH-001 — schema fails when networkCode is removed",
    { tag: ["@mutation-proof", "@asset-management", "@network-hierarchy"] },
    async () => {
      const mutated = structuredClone(sampleNetworkHierarchySuccess);
      delete (mutated.data.hierarchy[0] as Record<string, unknown>).networkCode;
      const result = NetworkHierarchySuccessResponseSchema.safeParse(mutated);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(JSON.stringify(result.error.issues)).toMatch(/networkCode/i);
      }
    },
  );

  test(
    "MUT-AM-NH-002 — schema rejects unexpected node field (.strict())",
    { tag: ["@mutation-proof", "@asset-management", "@network-hierarchy"] },
    async () => {
      const mutated = structuredClone(sampleNetworkHierarchySuccess);
      (mutated.data.hierarchy[0] as Record<string, unknown>).debugFlag = true;
      const result = NetworkHierarchySuccessResponseSchema.safeParse(mutated);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(JSON.stringify(result.error.issues)).toMatch(
          /debugFlag|unrecognized_keys/i,
        );
      }
    },
  );

  test(
    "MUT-AM-NH-003 — validateExpectedLevels fails when Feeder is missing",
    { tag: ["@mutation-proof", "@asset-management", "@network-hierarchy"] },
    async () => {
      const nodes: NetworkNode[] = structuredClone(
        sampleNetworkHierarchySuccess.data.hierarchy,
      );
      nodes[0].children = [];
      const message = captureThrownMessage(() =>
        new NetworkHierarchyValidator().validateExpectedLevels(nodes),
      );
      expect(message).not.toEqual("");
      expect(message).toMatch(/Feeder|expected|toContain|Received/i);
    },
  );

  test(
    "MUT-AM-NH-004 — validateDuplicateIds fails on duplicate networkLookupId",
    { tag: ["@mutation-proof", "@asset-management", "@network-hierarchy"] },
    async () => {
      const nodes: NetworkNode[] = structuredClone(
        sampleNetworkHierarchySuccess.data.hierarchy,
      );
      nodes[0].children.push({ ...nodes[0].children[0], networkLookupId: 1 });
      const message = captureThrownMessage(() =>
        new NetworkHierarchyValidator().validateDuplicateIds(nodes),
      );
      expect(message).not.toEqual("");
      expect(message).toMatch(/expected|Received|toBe|unique|size/i);
    },
  );

  test(
    "MUT-AM-NH-005 — schema rejects consumerCount as string",
    { tag: ["@mutation-proof", "@asset-management", "@network-hierarchy"] },
    async () => {
      const mutated = structuredClone(sampleNetworkHierarchySuccess);
      const dtr = mutated.data.hierarchy[0].children[0].dtrs[0] as Record<
        string,
        unknown
      >;
      dtr.consumerCount = "2";
      const result = NetworkHierarchySuccessResponseSchema.safeParse(mutated);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(JSON.stringify(result.error.issues)).toMatch(/consumerCount/i);
      }
    },
  );

  test(
    "MUT-AM-NH-006 — schema rejects children = null",
    { tag: ["@mutation-proof", "@asset-management", "@network-hierarchy"] },
    async () => {
      const mutated = structuredClone(sampleNetworkHierarchySuccess);
      (mutated.data.hierarchy[0] as Record<string, unknown>).children = null;
      const result = NetworkHierarchySuccessResponseSchema.safeParse(mutated);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(JSON.stringify(result.error.issues)).toMatch(/children/i);
      }
    },
  );

  test(
    "MUT-AM-NH-007 — schema rejects non-positive networkLookupId",
    { tag: ["@mutation-proof", "@asset-management", "@network-hierarchy"] },
    async () => {
      const mutated = structuredClone(sampleNetworkHierarchySuccess);
      mutated.data.hierarchy[0].networkLookupId = 0;
      const result = NetworkHierarchySuccessResponseSchema.safeParse(mutated);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(JSON.stringify(result.error.issues)).toMatch(
          /networkLookupId/i,
        );
      }
    },
  );

  test(
    "MUT-AM-NH-008 — schema rejects empty networkName",
    { tag: ["@mutation-proof", "@asset-management", "@network-hierarchy"] },
    async () => {
      const mutated = structuredClone(sampleNetworkHierarchySuccess);
      mutated.data.hierarchy[0].networkName = "";
      const result = NetworkHierarchySuccessResponseSchema.safeParse(mutated);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(JSON.stringify(result.error.issues)).toMatch(/networkName/i);
      }
    },
  );
});
