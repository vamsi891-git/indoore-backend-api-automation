import { test, expect } from "@playwright/test";
import { AssetExportMapper } from "../../Mapper/assetexport.mapper";
import { AssetExportValidator } from "../../Validator/assetexport.validator";
import { AssetExportRowSchema } from "../../schemas/asset-management.schemas";
import { captureThrownMessage } from "./fixtures/capture-throw";
import {
  sampleAssetExportCsv,
  sampleOrganisationExportCsv,
} from "./fixtures/asset-sample.fixture";

test.describe("Mutation proof — Asset export", () => {
  test(
    "MUT-AM-EX-001 — headers fail when a column is renamed",
    { tag: ["@mutation-proof", "@asset-management", "@asset-export"] },
    async () => {
      const mutated = sampleAssetExportCsv.replace(
        "Hierarchy Type",
        "hierarchy_type",
      );
      const data = AssetExportMapper.mapCsv(mutated);
      const message = captureThrownMessage(() =>
        new AssetExportValidator().validateHeaders(data, "network"),
      );
      expect(message).not.toEqual("");
      expect(message).toMatch(
        /Hierarchy Type|hierarchy_type|expected|Received/i,
      );
    },
  );

  test(
    "MUT-AM-EX-002 — headers fail when an extra column is added",
    { tag: ["@mutation-proof", "@asset-management", "@asset-export"] },
    async () => {
      const mutated = sampleAssetExportCsv.replace(
        "Meter Count",
        "Meter Count,debugFlag",
      );
      const data = AssetExportMapper.mapCsv(mutated);
      const message = captureThrownMessage(() =>
        new AssetExportValidator().validateHeaders(data, "network"),
      );
      expect(message).not.toEqual("");
      expect(message).toMatch(/debugFlag|Meter Count|expected|Received/i);
    },
  );

  test(
    "MUT-AM-EX-010 — organisation headers fail when Office Code is renamed",
    { tag: ["@mutation-proof", "@asset-management", "@asset-export"] },
    async () => {
      const mutated = sampleOrganisationExportCsv.replace(
        "Office Code",
        "Asset Code",
      );
      const data = AssetExportMapper.mapCsv(mutated);
      const message = captureThrownMessage(() =>
        new AssetExportValidator().validateHeaders(data, "organisation"),
      );
      expect(message).not.toEqual("");
      expect(message).toMatch(/Office Code|Asset Code|expected|Received/i);
    },
  );

  test(
    "MUT-AM-EX-003 — organisation counts fail when consumerCount is filled",
    { tag: ["@mutation-proof", "@asset-management", "@asset-export"] },
    async () => {
      const data = AssetExportMapper.mapCsv(sampleOrganisationExportCsv);
      data.items[0].consumerCount = "12";
      const message = captureThrownMessage(() =>
        new AssetExportValidator().validateKindCounts(data, "organisation"),
      );
      expect(message).not.toEqual("");
      expect(message).toMatch(/12|expected|Received|toEqual/i);
    },
  );

  test(
    "MUT-AM-EX-004 — network feeder counts fail when meterCount is filled",
    { tag: ["@mutation-proof", "@asset-management", "@asset-export"] },
    async () => {
      const data = AssetExportMapper.mapCsv(sampleAssetExportCsv);
      const feeder = data.items.find((row) => /feeder/i.test(row.hierarchyType));
      expect(feeder).toBeTruthy();
      if (feeder == null) return;
      feeder.meterCount = "4";
      const message = captureThrownMessage(() =>
        new AssetExportValidator().validateKindCounts(data, "network"),
      );
      expect(message).not.toEqual("");
      expect(message).toMatch(/4|expected|Received|toEqual/i);
    },
  );

  test(
    "MUT-AM-EX-005 — schema rejects empty assetName",
    { tag: ["@mutation-proof", "@asset-management", "@asset-export"] },
    async () => {
      const data = AssetExportMapper.mapCsv(sampleAssetExportCsv);
      data.items[0].assetName = "   ";
      const result = AssetExportRowSchema.safeParse(data.items[0]);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(JSON.stringify(result.error.issues)).toMatch(/assetName/i);
      }
    },
  );

  test(
    "MUT-AM-EX-006 — schema rejects unexpected row field (.strict())",
    { tag: ["@mutation-proof", "@asset-management", "@asset-export"] },
    async () => {
      const data = AssetExportMapper.mapCsv(sampleAssetExportCsv);
      const mutated = { ...data.items[0], debugFlag: true };
      const result = AssetExportRowSchema.safeParse(mutated);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(JSON.stringify(result.error.issues)).toMatch(
          /debugFlag|unrecognized_keys/i,
        );
      }
    },
  );

  test(
    "MUT-AM-EX-007 — duplicate codes fail",
    { tag: ["@mutation-proof", "@asset-management", "@asset-export"] },
    async () => {
      const data = AssetExportMapper.mapCsv(sampleAssetExportCsv);
      data.items[1].hierarchyType = data.items[0].hierarchyType;
      data.items[1].assetCode = data.items[0].assetCode;
      const message = captureThrownMessage(() =>
        new AssetExportValidator().validateDuplicateCodes(data),
      );
      expect(message).not.toEqual("");
      expect(message).toMatch(/0|expected|Received|toEqual/i);
    },
  );

  test(
    "MUT-AM-EX-008 — hierarchy type fails for unexpected label",
    { tag: ["@mutation-proof", "@asset-management", "@asset-export"] },
    async () => {
      const data = AssetExportMapper.mapCsv(sampleAssetExportCsv);
      data.items[0].hierarchyType = "Office";
      const message = captureThrownMessage(() =>
        new AssetExportValidator().validateHierarchyTypes(data, "network"),
      );
      expect(message).not.toEqual("");
      expect(message).toMatch(/true|false|expected|Received/i);
    },
  );

  test(
    "MUT-AM-EX-009 — JSON error body fails CSV check",
    { tag: ["@mutation-proof", "@asset-management", "@asset-export"] },
    async () => {
      const message = captureThrownMessage(() =>
        new AssetExportValidator().validateNotJsonError(
          '{"success":false,"error":{"code":"BAD"}}',
        ),
      );
      expect(message).not.toEqual("");
      expect(message).toMatch(/JSON|CSV|expected|Received/i);
    },
  );
});
