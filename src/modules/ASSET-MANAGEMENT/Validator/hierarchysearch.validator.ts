import { expect } from "@playwright/test";
import { EXPECTED_HIERARCHY_CHILDREN_COLUMNS } from "../Data/hierarchychildren.data";
import {
  EXPECTED_HIERARCHY_SEARCH_ANCESTOR_COLUMNS,
  EXPECTED_HIERARCHY_SEARCH_COLUMNS,
} from "../Data/hierarchysearch.data";
import type { HierarchySearchData } from "../Mapper/hierarchysearch.mapper";
import { HierarchySearchSuccessResponseSchema } from "../schemas/asset-management.schemas";
import { AssetManagementCommonValidator } from "./asset-management-common.validator";
import { HierarchyChildrenValidator } from "./hierarchychildren.validator";

export class HierarchySearchValidator {
  private readonly nodeValidator = new HierarchyChildrenValidator();

  validateResponse(body: unknown) {
    AssetManagementCommonValidator.validateSuccessEnvelope(
      body as { success?: boolean },
    );
    AssetManagementCommonValidator.validateZodResponseSchema(
      body,
      HierarchySearchSuccessResponseSchema,
    );
  }

  validateColumns(data: HierarchySearchData) {
    if (data.items.length === 0) {
      return;
    }
    const itemKeys = Object.keys(data.items[0]).sort();
    expect(itemKeys).toEqual([...EXPECTED_HIERARCHY_SEARCH_COLUMNS].sort());

    const nodeKeys = Object.keys(data.items[0].node).sort();
    expect(nodeKeys).toEqual([...EXPECTED_HIERARCHY_CHILDREN_COLUMNS].sort());

    const ancestor = data.items[0].ancestors[0];
    if (ancestor != null) {
      expect(Object.keys(ancestor).sort()).toEqual(
        [...EXPECTED_HIERARCHY_SEARCH_ANCESTOR_COLUMNS].sort(),
      );
    }
  }

  validateItemsExist(data: HierarchySearchData) {
    if (data.total > 0 && data.page <= data.totalPages) {
      expect(data.items.length).toBeGreaterThan(0);
    } else {
      expect(data.items.length).toBe(0);
    }
  }

  validateFields(
    data: HierarchySearchData,
    mode: "network" | "organisation",
  ) {
    this.nodeValidator.validateFields(
      {
        items: data.items.map((item) => item.node),
        page: data.page,
        pageSize: data.pageSize,
        total: data.total,
        totalPages: data.totalPages,
      },
      mode,
    );
  }

  validateSearchMatch(data: HierarchySearchData, q: string) {
    const needle = q.trim().toLowerCase();
    data.items.forEach((item) => {
      const haystack = `${item.node.name} ${item.node.code}`.toLowerCase();
      expect(
        haystack.includes(needle),
        `node ${item.node.id} "${item.node.name}" / "${item.node.code}" should match q="${q}"`,
      ).toBe(true);
    });
  }

  validateAncestors(data: HierarchySearchData) {
    data.items.forEach((item) => {
      expect(Array.isArray(item.ancestors)).toBe(true);
      const ancestorIds = item.ancestors.map((ancestor) => ancestor.id);
      expect(new Set(ancestorIds).size).toEqual(ancestorIds.length);
      expect(ancestorIds).not.toContain(item.node.id);

      item.ancestors.forEach((ancestor) => {
        expect(ancestor.id).toBeGreaterThan(0);
        expect(ancestor.name.trim()).not.toEqual("");
        expect(ancestor.type.trim()).not.toEqual("");
        if (ancestor.code?.trim()) {
          expect(ancestor.code.trim()).not.toEqual("");
        } else {
          console.log("Empty hierarchy search ancestor code:", {
            id: ancestor.id,
            name: ancestor.name,
            type: ancestor.type,
          });
        }
      });

      if (item.node.parentId != null && item.node.parentId !== 0) {
        const last = item.ancestors[item.ancestors.length - 1];
        expect(last?.id).toEqual(item.node.parentId);
      }
    });
  }

  validateDuplicateIds(data: HierarchySearchData) {
    const ids = data.items.map((item) => item.node.id);
    expect(new Set(ids).size).toEqual(ids.length);
  }

  validatePagination(data: HierarchySearchData) {
    expect(data.page).toBeGreaterThan(0);
    expect(data.pageSize).toBeGreaterThan(0);
    expect(data.total).toBeGreaterThanOrEqual(0);
    expect(data.totalPages).toBeGreaterThanOrEqual(0);
    expect(data.items.length).toBeLessThanOrEqual(data.pageSize);
  }

  validatePaginationConsistency(
    data: HierarchySearchData,
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
