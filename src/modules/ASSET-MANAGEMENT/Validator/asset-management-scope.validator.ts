import { expect } from "@playwright/test";
import type { HierarchyDtrSummary } from "../utils/asset-management.helper";

export class AssetManagementScopeValidator {
  /** Scoped role should never expose more DTRs or meter counts than the admin baseline. */
  static validateScopedNetworkHierarchy(
    admin: HierarchyDtrSummary,
    scoped: HierarchyDtrSummary,
    roleLabel: string,
  ): void {
    expect(
      scoped.dtrs.length,
      `${roleLabel} visible DTR count`,
    ).toBeLessThanOrEqual(admin.dtrs.length);
    expect(
      scoped.totalMeterCount,
      `${roleLabel} visible meter total`,
    ).toBeLessThanOrEqual(admin.totalMeterCount);

    for (const scopedDtr of scoped.dtrs) {
      const adminDtr = admin.dtrs.find(
        (d) => d.networkLookupId === scopedDtr.networkLookupId,
      );
      expect(
        adminDtr,
        `${roleLabel} DTR ${scopedDtr.networkLookupId} must exist in admin hierarchy`,
      ).toBeTruthy();
      expect(scopedDtr.consumerCount).toBeLessThanOrEqual(adminDtr!.consumerCount);
    }
  }

  static validateScopedOrganisationHierarchy(
    admin: HierarchyDtrSummary,
    scoped: HierarchyDtrSummary,
    roleLabel: string,
  ): void {
    this.validateScopedNetworkHierarchy(admin, scoped, roleLabel);
  }

  static validateScopedDtrDetailTotal(
    adminTotal: number,
    scopedTotal: number,
    roleLabel: string,
  ): void {
    expect(
      scopedTotal,
      `${roleLabel} DTR detail total`,
    ).toBeLessThanOrEqual(adminTotal);
  }
}
