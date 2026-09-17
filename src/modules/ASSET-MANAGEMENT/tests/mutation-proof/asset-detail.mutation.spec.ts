import { test, expect } from "@playwright/test";
import { AssetDetailValidator } from "../../Validator/assetdetail.validator";
import { AssetDetailSuccessResponseSchema } from "../../schemas/asset-management.schemas";
import { captureThrownMessage } from "./fixtures/capture-throw";
import { sampleAssetDetailSuccess } from "./fixtures/asset-sample.fixture";
import type { AssetDetailData } from "../../Mapper/assetdetail.mapper";

test.describe("Mutation proof — Asset detail", () => {
  test(
    "MUT-AM-AD-001 — schema fails when kind is removed",
    { tag: ["@mutation-proof", "@asset-management", "@asset-detail"] },
    async () => {
      const mutated = structuredClone(sampleAssetDetailSuccess);
      delete (mutated.data as Record<string, unknown>).kind;
      const result = AssetDetailSuccessResponseSchema.safeParse(mutated);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(JSON.stringify(result.error.issues)).toMatch(/kind/i);
      }
    },
  );

  test(
    "MUT-AM-AD-002 — schema rejects unexpected data field (.strict())",
    { tag: ["@mutation-proof", "@asset-management", "@asset-detail"] },
    async () => {
      const mutated = structuredClone(sampleAssetDetailSuccess);
      (mutated.data as Record<string, unknown>).debugFlag = true;
      const result = AssetDetailSuccessResponseSchema.safeParse(mutated);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(JSON.stringify(result.error.issues)).toMatch(
          /debugFlag|unrecognized_keys/i,
        );
      }
    },
  );

  test(
    "MUT-AM-AD-003 — schema rejects invalid relationship",
    { tag: ["@mutation-proof", "@asset-management", "@asset-detail"] },
    async () => {
      const mutated = structuredClone(sampleAssetDetailSuccess);
      mutated.data.hierarchySummary[0].relationship = "CHILD" as never;
      const result = AssetDetailSuccessResponseSchema.safeParse(mutated);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(JSON.stringify(result.error.issues)).toMatch(/relationship/i);
      }
    },
  );

  test(
    "MUT-AM-AD-004 — validateIdentity fails when kind does not match",
    { tag: ["@mutation-proof", "@asset-management", "@asset-detail"] },
    async () => {
      const data: AssetDetailData = structuredClone(
        sampleAssetDetailSuccess.data,
      );
      const message = captureThrownMessage(() =>
        new AssetDetailValidator().validateIdentity(data, "organisation", 4),
      );
      expect(message).not.toEqual("");
      expect(message).toMatch(/kind|organisation|network|expected|Received/i);
    },
  );

  test(
    "MUT-AM-AD-005 — validateHierarchySummary fails when SELF type drifts",
    { tag: ["@mutation-proof", "@asset-management", "@asset-detail"] },
    async () => {
      const data: AssetDetailData = structuredClone(
        sampleAssetDetailSuccess.data,
      );
      const self = data.hierarchySummary.find(
        (row) => row.relationship === "SELF",
      );
      if (self) self.type = "DTR";
      const message = captureThrownMessage(() =>
        new AssetDetailValidator().validateHierarchySummary(data),
      );
      expect(message).not.toEqual("");
      expect(message).toMatch(/FEEDER|DTR|expected|Received|toEqual/i);
    },
  );

  test(
    "MUT-AM-AD-006 — validateCounts fails when totalOnline is off",
    { tag: ["@mutation-proof", "@asset-management", "@asset-detail"] },
    async () => {
      const data: AssetDetailData = structuredClone(
        sampleAssetDetailSuccess.data,
      );
      if (data.communicationSummary) {
        data.communicationSummary.totalOnline = 9;
      }
      const message = captureThrownMessage(() =>
        new AssetDetailValidator().validateCounts(data),
      );
      expect(message).not.toEqual("");
      expect(message).toMatch(/9|0|expected|Received|toEqual/i);
    },
  );

  test(
    "MUT-AM-AD-007 — validateHierarchyPath fails when path includes self id",
    { tag: ["@mutation-proof", "@asset-management", "@asset-detail"] },
    async () => {
      const data: AssetDetailData = structuredClone(
        sampleAssetDetailSuccess.data,
      );
      data.hierarchyPath[0].id = data.id;
      const message = captureThrownMessage(() =>
        new AssetDetailValidator().validateHierarchyPath(data),
      );
      expect(message).not.toEqual("");
      expect(message).toMatch(/not to contain|expected|Received/i);
    },
  );

  test(
    "MUT-AM-AD-008 — schema rejects consumerCount as string",
    { tag: ["@mutation-proof", "@asset-management", "@asset-detail"] },
    async () => {
      const mutated = structuredClone(sampleAssetDetailSuccess);
      (mutated.data as Record<string, unknown>).consumerCount = "12758";
      const result = AssetDetailSuccessResponseSchema.safeParse(mutated);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(JSON.stringify(result.error.issues)).toMatch(/consumerCount/i);
      }
    },
  );
});
