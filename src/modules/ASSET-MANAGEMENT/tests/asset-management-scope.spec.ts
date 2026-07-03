import type { APIRequestContext } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { DtrDetailApi } from "../Api/DtrId.api";
import { NetworkHierarchyApi } from "../Api/networkhierarchy.api";
import { OrganisationHierarchyApi } from "../Api/organizationhierarchy.api";
import {
  AssetDtrLookupId,
  assetManagementHierarchyMaxResponseTimeMs,
  assetManagementHierarchyRequestTimeoutMs,
  DtrDetailPaginationQueries,
  type ScopedRoleCredentials,
} from "../Data/asset-management.common.data";
import { DtrDetailMapper } from "../Mapper/dtrId.mapper";
import { NetworkHierarchyMapper } from "../Mapper/networkhierarchy.mapper";
import { OrganisationHierarchyMapper } from "../Mapper/organizationhierarchy.mapper";
import { AssetManagementScopeValidator } from "../Validator/asset-management-scope.validator";
import {
  findDtrWithHighestConsumerCount,
  findScopedSubtreeNetworkRootId,
  findScopedSubtreeOrganisationRootId,
  summarizeNetworkDtrs,
  summarizeOrganisationDtrs,
} from "../utils/asset-management.helper";
import { loginAndCreateApiContext } from "../utils/scoped-auth.helper";
import { resolveAssetManagementScopedRoles } from "../utils/scoped-roles.resolver";
const hierarchyOptions = {
  maxResponseTimeMs: assetManagementHierarchyMaxResponseTimeMs,
  requestTimeoutMs: assetManagementHierarchyRequestTimeoutMs,
};
async function runRoleBasedScopeCoverage(
  adminApi: APIRequestContext,
  roles: ScopedRoleCredentials[],
): Promise<void> {
  const validation = new ValidationEngine();
  const adminNetworkApi = new NetworkHierarchyApi(adminApi);
  const adminOrgApi = new OrganisationHierarchyApi(adminApi);
  const adminDtrApi = new DtrDetailApi(adminApi);
  const adminNetwork = NetworkHierarchyMapper.mapData(
    (await adminNetworkApi.getNetworkHierarchy(undefined, hierarchyOptions.requestTimeoutMs))
      .responseBody.data,
  ).hierarchy;
  const adminOrg = OrganisationHierarchyMapper.mapData(
    (await adminOrgApi.getOrganisationHierarchy(undefined, hierarchyOptions.requestTimeoutMs))
      .responseBody.data,
  ).hierarchy;
  const adminNetworkSummary = summarizeNetworkDtrs(adminNetwork);
  const adminOrgSummary = summarizeOrganisationDtrs(adminOrg);
  const dtrId =
    process.env.ASSET_DTR_LOOKUP_ID != null
      ? AssetDtrLookupId
      : (findDtrWithHighestConsumerCount(adminNetwork)?.networkLookupId ??
        AssetDtrLookupId);
  const adminDetail = DtrDetailMapper.mapData(
    (
      await adminDtrApi.getDtrDetails(
        dtrId,
        DtrDetailPaginationQueries.default.page,
        DtrDetailPaginationQueries.default.limit,
      )
    ).responseBody.data,
  );
  for (const role of roles) {
    const scopedApi = await loginAndCreateApiContext(role.email, role.password);
    try {
      const scopedNetwork = NetworkHierarchyMapper.mapData(
        (
          await new NetworkHierarchyApi(scopedApi).getNetworkHierarchy(
            undefined,
            hierarchyOptions.requestTimeoutMs,
          )
        ).responseBody.data,
      ).hierarchy;
      const scopedOrg = OrganisationHierarchyMapper.mapData(
        (
          await new OrganisationHierarchyApi(scopedApi).getOrganisationHierarchy(
            undefined,
            hierarchyOptions.requestTimeoutMs,
          )
        ).responseBody.data,
      ).hierarchy;
      const scopedDetail = DtrDetailMapper.mapData(
        (
          await new DtrDetailApi(scopedApi).getDtrDetails(
            dtrId,
            DtrDetailPaginationQueries.default.page,
            DtrDetailPaginationQueries.default.limit,
          )
        ).responseBody.data,
      );

      validation.execute(`${role.label} — network hierarchy scope`, () => {
        AssetManagementScopeValidator.validateScopedNetworkHierarchy(
          adminNetworkSummary,
          summarizeNetworkDtrs(scopedNetwork),
          role.label,
        );
      });
      validation.execute(`${role.label} — organisation hierarchy scope`, () => {
        AssetManagementScopeValidator.validateScopedOrganisationHierarchy(
          adminOrgSummary,
          summarizeOrganisationDtrs(scopedOrg),
          role.label,
        );
      });
      validation.execute(`${role.label} — DTR detail total scope`, () => {
        AssetManagementScopeValidator.validateScopedDtrDetailTotal(
          adminDetail.total,
          scopedDetail.total,
          role.label,
        );
      });
    } finally {
      await scopedApi.dispose();
    }
  }

  validation.printSummary("Asset Management Data Scope Coverage", 0);
}

async function runAdminSubtreeScopeFallback(adminApi: APIRequestContext): Promise<void> {
  const validation = new ValidationEngine();
  const networkApi = new NetworkHierarchyApi(adminApi);
  const orgApi = new OrganisationHierarchyApi(adminApi);

  const fullNetwork = NetworkHierarchyMapper.mapData(
    (await networkApi.getNetworkHierarchy(undefined, hierarchyOptions.requestTimeoutMs))
      .responseBody.data,
  ).hierarchy;
  const fullOrg = OrganisationHierarchyMapper.mapData(
    (await orgApi.getOrganisationHierarchy(undefined, hierarchyOptions.requestTimeoutMs))
      .responseBody.data,
  ).hierarchy;

  const networkRootId = findScopedSubtreeNetworkRootId(fullNetwork);
  const orgRootId = findScopedSubtreeOrganisationRootId(fullOrg);

  if (networkRootId != null) {
    const subtreeNetwork = NetworkHierarchyMapper.mapData(
      (
        await networkApi.getNetworkHierarchy(
          networkRootId,
          hierarchyOptions.requestTimeoutMs,
        )
      ).responseBody.data,
    ).hierarchy;

    validation.execute("Admin rootId — network hierarchy subset", () => {
      AssetManagementScopeValidator.validateScopedNetworkHierarchy(
        summarizeNetworkDtrs(fullNetwork),
        summarizeNetworkDtrs(subtreeNetwork),
        `Network rootId ${networkRootId}`,
      );
    });
  }

  if (orgRootId != null) {
    const subtreeOrg = OrganisationHierarchyMapper.mapData(
      (
        await orgApi.getOrganisationHierarchy(orgRootId, hierarchyOptions.requestTimeoutMs)
      ).responseBody.data,
    ).hierarchy;

    validation.execute("Admin rootId — organisation hierarchy subset", () => {
      AssetManagementScopeValidator.validateScopedOrganisationHierarchy(
        summarizeOrganisationDtrs(fullOrg),
        summarizeOrganisationDtrs(subtreeOrg),
        `Organisation rootId ${orgRootId}`,
      );
    });
  }

  validation.printSummary("Asset Management Data Scope Coverage (rootId fallback)", 0);
}

export async function runAssetManagementScopeCoverage(
  adminApi: APIRequestContext,
): Promise<void> {
  const roles = await resolveAssetManagementScopedRoles(adminApi);

  if (roles.length > 0) {
    await runRoleBasedScopeCoverage(adminApi, roles);
    return;
  }

  await runAdminSubtreeScopeFallback(adminApi);
}

test.describe("Asset Management — Data Scope Coverage", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(600_000);

  test(
    "Scoped roles see subset of admin hierarchy and DTR counts",
    { tag: ["@asset-management", "@coverage", "@scope"] },
    async ({ authenticatedApi }) => {
      await runAssetManagementScopeCoverage(authenticatedApi);
    },
  );
});
