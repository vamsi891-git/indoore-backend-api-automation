import { expect } from "@playwright/test";
import { EXPECTED_HIERARCHY_CHILDREN_COLUMNS } from "../Data/hierarchychildren.data";
import type {
  HierarchyChildrenData,
  HierarchyExplorerNode,
} from "../Mapper/hierarchychildren.mapper";
import { HierarchyChildrenSuccessResponseSchema } from "../schemas/asset-management.schemas";
import { AssetManagementCommonValidator } from "./asset-management-common.validator";

export class HierarchyChildrenValidator {
  validateResponse(body: unknown) {
    AssetManagementCommonValidator.validateSuccessEnvelope(
      body as { success?: boolean },
    );
    AssetManagementCommonValidator.validateZodResponseSchema(
      body,
      HierarchyChildrenSuccessResponseSchema,
    );
  }

  validateColumns(data: HierarchyChildrenData) {
    if (data.items.length === 0) {
      return;
    }
    const keys = Object.keys(data.items[0]).sort();
    expect(keys).toEqual([...EXPECTED_HIERARCHY_CHILDREN_COLUMNS].sort());
  }

  validateItemsExist(data: HierarchyChildrenData) {
    if (data.total > 0 && data.page <= data.totalPages) {
      expect(data.items.length).toBeGreaterThan(0);
    } else {
      expect(data.items.length).toBe(0);
    }
  }

  validateFields(
    data: HierarchyChildrenData,
    mode: "network" | "organisation",
  ) {
    data.items.forEach((item) => {
      expect(item.id).toBeGreaterThan(0);
      expect(item.name.trim()).not.toEqual("");
      expect(item.displayName.trim()).not.toEqual("");
      expect(item.type.trim()).not.toEqual("");
      expect(item.status).toEqual("UNKNOWN");
      expect(Number.isInteger(item.childCount)).toBe(true);
      expect(item.childCount).toBeGreaterThanOrEqual(0);
      expect(item.hasChildren).toEqual(item.childCount > 0);

      if (item.code?.trim()) {
        expect(item.code.trim()).not.toEqual("");
      } else {
        console.log("Empty hierarchy children code:", {
          id: item.id,
          name: item.name,
          type: item.type,
        });
      }

      if (mode === "organisation") {
        expect(item.isDtr).toBe(false);
        expect(item.consumerCount).toBeNull();
        expect(item.meterCount).toBeNull();
      } else if (item.isDtr) {
        expect(item.type.toUpperCase()).toContain("DTR");
        expect(item.consumerCount).not.toBeNull();
        expect(item.meterCount).not.toBeNull();
        expect(item.consumerCount as number).toBeGreaterThanOrEqual(0);
        expect(item.meterCount as number).toBeGreaterThanOrEqual(0);
      } else {
        expect(item.consumerCount).toBeNull();
        expect(item.meterCount).toBeNull();
      }
    });
  }

  validateDuplicateIds(data: HierarchyChildrenData) {
    const ids = data.items.map((item) => item.id);
    expect(new Set(ids).size).toEqual(ids.length);
  }

  validateParentId(
    items: HierarchyExplorerNode[],
    expectedParentId: number,
  ) {
    items.forEach((item) => {
      expect(item.parentId).toEqual(expectedParentId);
    });
  }

  validatePagination(data: HierarchyChildrenData) {
    expect(data.page).toBeGreaterThan(0);
    expect(data.pageSize).toBeGreaterThan(0);
    expect(data.total).toBeGreaterThanOrEqual(0);
    expect(data.totalPages).toBeGreaterThanOrEqual(0);
    expect(data.items.length).toBeLessThanOrEqual(data.pageSize);
  }

  validatePaginationConsistency(
    data: HierarchyChildrenData,
    requestedPage: number,
    requestedPageSize: number,
  ) {
    expect(data.page).toEqual(requestedPage);
    expect(data.pageSize).toEqual(requestedPageSize);
    expect(data.items.length).toBeLessThanOrEqual(data.pageSize);

    if (data.total === 0) {
      expect(data.totalPages).toEqual(0);
      expect(data.items.length).toEqual(0);
      return;
    }

    expect(data.totalPages).toEqual(Math.ceil(data.total / data.pageSize));

    if (data.page > data.totalPages) {
      expect(data.items.length).toEqual(0);
      return;
    }

    const remaining = data.total - (data.page - 1) * data.pageSize;
    expect(data.items.length).toEqual(Math.min(data.pageSize, remaining));
  }
}
