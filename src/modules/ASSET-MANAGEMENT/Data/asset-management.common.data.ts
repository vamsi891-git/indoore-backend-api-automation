export const assetManagementMaxResponseTimeMs = 120_000;

/** Large hierarchy payloads can exceed the default 90s Playwright request timeout. */
export const assetManagementHierarchyRequestTimeoutMs = 180_000;
export const assetManagementHierarchyMaxResponseTimeMs = 180_000;

export const assetManagementPaths = {
  networkHierarchy: "/indore/asset-management/network-hierarchy",
  organisationHierarchy: "/indore/asset-management/organisation-hierarchy",
  dtrDetail: (dtrId: number, page: number, limit: number) =>
    `/indore/asset-management/dtr/${dtrId}?page=${page}&limit=${limit}`,
} as const;

/** Non-existent network / DTR IDs for negative tests */
export const AssetManagementNegativeData = {
  unknownNetworkLookupId: 9_999_999_999,
  unknownOrganisationLookupId: 9_999_999_999,
  unknownDtrId: 9_999_999_999,
  invalidDtrId: 0,
} as const;

export const DtrDetailPaginationQueries = {
  default: { page: 1, limit: 20 },
  page2: { page: 2, limit: 20 },
  smallPage: { page: 1, limit: 10 },
  beyondTotal: { page: 999_999, limit: 20 },
} as const;

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

/** Override via ASSET_DTR_LOOKUP_ID in .env */
export const AssetDtrLookupId = parsePositiveInt(process.env.ASSET_DTR_LOOKUP_ID, 2339);

/** Override via ASSET_NETWORK_ROOT_LOOKUP_ID in .env */
export const AssetNetworkRootLookupId = parsePositiveInt(
  process.env.ASSET_NETWORK_ROOT_LOOKUP_ID,
  0,
);

/** Override via ASSET_ORG_ROOT_LOOKUP_ID in .env */
export const AssetOrgRootLookupId = parsePositiveInt(
  process.env.ASSET_ORG_ROOT_LOOKUP_ID,
  0,
);

export type ScopedRoleCredentials = {
  label: string;
  email: string;
  password: string;
};

function readScopedRole(
  label: string,
  emailKey: "VIEWER_EMAIL" | "OPERATOR_EMAIL",
  passwordKey: "VIEWER_PASSWORD" | "OPERATOR_PASSWORD",
): ScopedRoleCredentials | undefined {
  const email = process.env[emailKey]?.trim();
  const password = process.env[passwordKey];
  if (!email || !password) {
    return undefined;
  }
  return { label, email, password };
}

/** Optional roles for data-scope coverage — skipped when unset. */
export const AssetManagementScopedRoles: ScopedRoleCredentials[] = [
  readScopedRole("Viewer", "VIEWER_EMAIL", "VIEWER_PASSWORD"),
  readScopedRole("Operator", "OPERATOR_EMAIL", "OPERATOR_PASSWORD"),
].filter((role): role is ScopedRoleCredentials => role != null);

export const hasAssetManagementScopedRoles = AssetManagementScopedRoles.length > 0;
