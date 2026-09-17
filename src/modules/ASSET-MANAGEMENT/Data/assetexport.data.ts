import type { HierarchyExplorerMode } from "./hierarchychildren.data";
import { HierarchySearchQueries } from "./hierarchysearch.data";

export type AssetExportKind = Extract<
  HierarchyExplorerMode,
  "network" | "organisation"
>;

export const EXPECTED_NETWORK_ASSET_EXPORT_COLUMNS = [
  "Hierarchy Type",
  "Asset Code",
  "Asset Name",
  "Display Name",
  "Parent Type",
  "Parent Code",
  "Parent Name",
  "Consumer Count",
  "Meter Count",
] as const;

export const EXPECTED_ORGANISATION_ASSET_EXPORT_COLUMNS = [
  "Hierarchy Type",
  "Office Code",
  "Office Name",
  "Display Name",
  "Parent Type",
  "Parent Code",
  "Parent Name",
] as const;

export const EXPECTED_NETWORK_EXPORT_HIERARCHY_TYPES = [
  "SUB_STATION",
  "FEEDER",
  "DTR",
] as const;

export const EXPECTED_ORGANISATION_EXPORT_HIERARCHY_TYPES = [
  "DISCOM",
  "REGION",
  "CIRCLE",
  "DIVISION",
  "ZONE",
] as const;

export function assetExportQuery(params: {
  kind: AssetExportKind;
  hierarchyId?: number;
  q?: string;
}): string {
  const parts = [`kind=${params.kind}`];
  if (params.hierarchyId != null) {
    parts.push(`hierarchyId=${params.hierarchyId}`);
  }
  if (params.q != null) {
    parts.push(`q=${encodeURIComponent(params.q)}`);
  }
  return parts.join("&");
}

export const AssetExportSearchQueries = {
  organisation: HierarchySearchQueries.organisation.q,
  network: HierarchySearchQueries.network.q,
  noMatch: HierarchySearchQueries.noMatch,
} as const;

export const AssetExportInvalidQueries = [
  {
    testName: "GET /asset-management/export — missing kind",
    query: "",
    expectedStatus: [400, 422] as const,
  },
  {
    testName: "GET /asset-management/export — kind=foo",
    query: "kind=foo",
    expectedStatus: [400, 422] as const,
  },
  {
    testName: "GET /asset-management/export — kind=dtr",
    query: "kind=dtr",
    expectedStatus: [400, 422] as const,
  },
  {
    testName: "GET /asset-management/export — hierarchyId=abc",
    query: "kind=network&hierarchyId=abc",
    expectedStatus: [400, 422] as const,
  },
] as const;
