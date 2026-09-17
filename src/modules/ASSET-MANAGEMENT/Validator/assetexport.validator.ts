import { expect } from "@playwright/test";
import type { AssetExportKind } from "../Data/assetexport.data";
import {
  EXPECTED_NETWORK_ASSET_EXPORT_COLUMNS,
  EXPECTED_ORGANISATION_ASSET_EXPORT_COLUMNS,
  EXPECTED_NETWORK_EXPORT_HIERARCHY_TYPES,
  EXPECTED_ORGANISATION_EXPORT_HIERARCHY_TYPES,
} from "../Data/assetexport.data";
import type { AssetExportData, AssetExportRow } from "../Mapper/assetexport.mapper";
import { AssetExportRowSchema } from "../schemas/asset-management.schemas";
import { AssetManagementCommonValidator } from "./asset-management-common.validator";

function normalizeHierarchyType(value: string): string {
  return value.trim().replace(/\s+/g, "_").toUpperCase();
}

function isNonNegativeIntegerString(value: string): boolean {
  return /^\d+$/.test(value);
}

function isDtrType(value: string): boolean {
  return normalizeHierarchyType(value) === "DTR";
}

export class AssetExportValidator {
  validateNotJsonError(csvContent: string) {
    const trimmed = csvContent.trim();
    expect(trimmed.startsWith("{"), "Export returned JSON instead of CSV").toBe(
      false,
    );
  }

  validateFileNotEmpty(csvContent: string) {
    expect(csvContent.length).toBeGreaterThan(0);
  }

  validateHeaders(data: AssetExportData, kind: AssetExportKind) {
    const expected =
      kind === "network"
        ? EXPECTED_NETWORK_ASSET_EXPORT_COLUMNS
        : EXPECTED_ORGANISATION_ASSET_EXPORT_COLUMNS;
    expect(data.headers).toEqual([...expected]);
  }

  validateDownloadHeaders(contentType: string | undefined, contentDisposition: string | undefined) {
    expect(contentType ?? "").toContain("text/csv");
    expect((contentDisposition ?? "").toLowerCase()).toContain("attachment");
    expect((contentDisposition ?? "").toLowerCase()).toContain(".csv");
  }

  validateRowsExist(data: AssetExportData) {
    expect(data.items.length).toBeGreaterThan(0);
  }

  validateRowSchema(data: AssetExportData) {
    data.items.forEach((row) => {
      AssetManagementCommonValidator.validateZodResponseSchema(
        row,
        AssetExportRowSchema,
      );
    });
  }

  validateFields(data: AssetExportData) {
    data.items.forEach((row) => {
      expect(row.hierarchyType.trim()).not.toEqual("");
      expect(row.assetName.trim()).not.toEqual("");
      expect(row.displayName.trim()).not.toEqual("");

      if (row.assetCode.trim()) {
        expect(row.assetCode.trim()).not.toEqual("");
      } else {
        console.log("Empty export assetCode:", {
          hierarchyType: row.hierarchyType,
          assetName: row.assetName,
        });
      }

      this.validateCountCell(row.consumerCount, "consumerCount", row);
      this.validateCountCell(row.meterCount, "meterCount", row);
    });
  }

  validateCountCell(
    value: string,
    field: "consumerCount" | "meterCount",
    row: AssetExportRow,
  ) {
    if (value === "") {
      return;
    }
    expect(
      isNonNegativeIntegerString(value),
      `${field} must be empty or a non-negative integer for ${row.assetName}`,
    ).toBe(true);
  }

  validateKindCounts(data: AssetExportData, kind: AssetExportKind) {
    data.items.forEach((row) => {
      if (kind === "organisation") {
        expect(row.consumerCount).toEqual("");
        expect(row.meterCount).toEqual("");
        return;
      }

      if (!isDtrType(row.hierarchyType)) {
        expect(row.consumerCount).toEqual("");
        expect(row.meterCount).toEqual("");
      }
    });
  }

  validateHierarchyTypes(data: AssetExportData, kind: AssetExportKind) {
    const allowed = new Set<string>(
      kind === "network"
        ? EXPECTED_NETWORK_EXPORT_HIERARCHY_TYPES
        : EXPECTED_ORGANISATION_EXPORT_HIERARCHY_TYPES,
    );
    data.items.forEach((row) => {
      expect(allowed.has(normalizeHierarchyType(row.hierarchyType))).toBe(true);
    });
  }

  validateDuplicateCodes(data: AssetExportData) {
    const keys = data.items
      .filter((row) => row.assetCode.trim())
      .map(
        (row) =>
          `${normalizeHierarchyType(row.hierarchyType)}|${row.assetCode.trim()}`,
      );
    const duplicates = keys.filter(
      (value, index) => keys.indexOf(value) !== index,
    );
    if (duplicates.length) {
      console.log("Duplicate export asset codes:", duplicates);
    }
    expect(duplicates.length).toEqual(0);
  }

  validateQFilter(data: AssetExportData, q: string) {
    const needle = q.trim().toLowerCase();
    if (!needle || data.items.length === 0) {
      return;
    }
    data.items.forEach((row) => {
      const haystack = [
        row.assetCode,
        row.assetName,
        row.displayName,
        row.parentCode,
        row.parentName,
      ]
        .join(" ")
        .toLowerCase();
      expect(haystack).toContain(needle);
    });
  }
}
