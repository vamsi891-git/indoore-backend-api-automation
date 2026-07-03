import { expect } from "@playwright/test";
import type { DtrNode } from "../Mapper/networkhierarchy.mapper";
import type { DtrDetailData } from "../Mapper/dtrId.mapper";

export class AssetManagementCoverageValidator {
  /** Backend: hierarchy `consumerCount` and detail `total` both count distinct meters. */
  static validateHierarchyCountMatchesDetailTotal(
    hierarchyDtr: DtrNode,
    detail: Pick<DtrDetailData, "total" | "dtrCode" | "dtrName">,
  ): void {
    expect(hierarchyDtr.networkLookupId).toBeGreaterThan(0);
    expect(hierarchyDtr.consumerCount).toEqual(detail.total);
    if (hierarchyDtr.dtrCode?.trim()) {
      expect(detail.dtrCode).toEqual(hierarchyDtr.dtrCode);
    }
    expect(detail.dtrName).toEqual(hierarchyDtr.dtrName);
  }

  static validateCrossPageConsumerIds(
    firstPageIds: number[],
    secondPageIds: number[],
  ): void {
    const overlap = firstPageIds.filter((id) => secondPageIds.includes(id));
    if (overlap.length) {
      console.log("Cross-page duplicate consumer IDs:", overlap);
    }
    expect(overlap.length).toEqual(0);
  }

  static validateZeroTotalContract(
    detail: Pick<DtrDetailData, "total" | "totalPages" | "consumers" | "page" | "limit">,
  ): void {
    expect(detail.total).toEqual(0);
    expect(detail.totalPages).toEqual(0);
    expect(detail.consumers.length).toEqual(0);
    expect(detail.page).toBeGreaterThan(0);
    expect(detail.limit).toBeGreaterThan(0);
  }

  static validateOrgNetworkDtrCountsAlign(
    networkDtr: DtrNode,
    orgDtr: DtrNode,
  ): void {
    expect(orgDtr.networkLookupId).toEqual(networkDtr.networkLookupId);
    expect(orgDtr.consumerCount).toEqual(networkDtr.consumerCount);
    expect(orgDtr.dtrName).toEqual(networkDtr.dtrName);
  }
}
