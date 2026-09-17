import { expect } from "@playwright/test";
import type { HierarchyExplorerMode } from "../Data/hierarchychildren.data";
import {
  EXPECTED_HIERARCHY_TYPE_FILTERABLE,
  EXPECTED_HIERARCHY_TYPES_COLUMNS,
  EXPECTED_NETWORK_HIERARCHY_TYPES,
  EXPECTED_ORGANISATION_HIERARCHY_TYPES,
} from "../Data/hierarchytypes.data";
import type { HierarchyTypesData } from "../Mapper/hierarchytypes.mapper";
import { HierarchyTypesSuccessResponseSchema } from "../schemas/asset-management.schemas";
import { AssetManagementCommonValidator } from "./asset-management-common.validator";

export class HierarchyTypesValidator {
  validateResponse(body: unknown) {
    AssetManagementCommonValidator.validateSuccessEnvelope(
      body as { success?: boolean },
    );
    AssetManagementCommonValidator.validateZodResponseSchema(
      body,
      HierarchyTypesSuccessResponseSchema,
    );
  }

  validateColumns(data: HierarchyTypesData) {
    if (data.items.length === 0) {
      return;
    }
    const keys = Object.keys(data.items[0]).sort();
    expect(keys).toEqual([...EXPECTED_HIERARCHY_TYPES_COLUMNS].sort());
  }

  validateItemsExist(data: HierarchyTypesData) {
    expect(data.items.length).toBeGreaterThan(0);
  }

  validateFields(data: HierarchyTypesData) {
    data.items.forEach((item, index) => {
      expect(item.id).toBeGreaterThan(0);
      expect(item.name.trim()).not.toEqual("");
      expect(item.label.trim()).not.toEqual("");
      expect(item.type.trim()).not.toEqual("");
      expect(item.order).toEqual(index + 1);
      expect(typeof item.filterable).toBe("boolean");

      if (item.code?.trim()) {
        expect(item.code.trim()).not.toEqual("");
      } else {
        console.log("Empty hierarchy type code:", {
          id: item.id,
          name: item.name,
          type: item.type,
        });
      }

      const expectedFilterable = EXPECTED_HIERARCHY_TYPE_FILTERABLE[item.type];
      if (expectedFilterable != null) {
        expect(item.filterable).toEqual(expectedFilterable);
      }
    });
  }

  validateDuplicateIds(data: HierarchyTypesData) {
    const ids = data.items.map((item) => item.id);
    expect(new Set(ids).size).toEqual(ids.length);
  }

  validateDuplicateTypes(data: HierarchyTypesData) {
    const types = data.items.map((item) => item.type);
    expect(new Set(types).size).toEqual(types.length);
  }

  validateExpectedTypes(
    data: HierarchyTypesData,
    mode: HierarchyExplorerMode,
  ) {
    const found = data.items.map((item) => item.type);
    const expected =
      mode === "network"
        ? EXPECTED_NETWORK_HIERARCHY_TYPES
        : EXPECTED_ORGANISATION_HIERARCHY_TYPES;
    expected.forEach((type) => {
      expect(found).toContain(type);
    });
  }
}
