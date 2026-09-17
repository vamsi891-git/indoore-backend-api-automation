import type { HierarchyExplorerMode } from "./hierarchychildren.data";

export const EXPECTED_HIERARCHY_TYPES_COLUMNS = [
  "id",
  "code",
  "name",
  "order",
  "type",
  "label",
  "filterable",
] as const;

export const EXPECTED_NETWORK_HIERARCHY_TYPES = [
  "SUB_STATION",
  "FEEDER",
  "DTR",
] as const;

export const EXPECTED_ORGANISATION_HIERARCHY_TYPES = [
  "DISCOM",
  "REGION",
  "CIRCLE",
  "DIVISION",
  "ZONE",
] as const;

export const EXPECTED_HIERARCHY_TYPE_FILTERABLE: Record<
  string,
  boolean
> = {
  SUB_STATION: true,
  FEEDER: true,
  DTR: true,
  DISCOM: false,
  REGION: false,
  CIRCLE: true,
  DIVISION: true,
  ZONE: true,
};

export function hierarchyTypesQuery(mode: HierarchyExplorerMode): string {
  return `mode=${mode}`;
}

export const HierarchyTypesInvalidQueries = [
  {
    testName: "GET /asset-management/hierarchy/types — missing mode",
    query: "",
    expectedStatus: [400, 422] as const,
  },
  {
    testName: "GET /asset-management/hierarchy/types — mode=foo",
    query: "mode=foo",
    expectedStatus: [400, 422] as const,
  },
] as const;
