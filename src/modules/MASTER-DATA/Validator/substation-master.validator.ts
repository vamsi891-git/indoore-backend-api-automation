import { expect } from "@playwright/test";
import {
  SubstationMasterData,
  SubstationMasterQuery,
  SubstationMasterResponse,
} from "../Mapper/substation-master.mapper";
import { MasterDataCommonValidator } from "./master-data-common.validator";

export class SubstationMasterValidator {
  validateResponse(response: SubstationMasterResponse): void {
    expect(response.success).toBeTruthy();
    expect(response.data).toBeDefined();
  }

  validateColumns(data: SubstationMasterData): void {
    MasterDataCommonValidator.validateColumns(data.columns);
  }

  validateItemsExist(data: SubstationMasterData): void {
    if (data.total > 0) {
      expect(data.items.length).toBeGreaterThan(0);
    } else {
      expect(data.items.length).toBe(0);
    }
  }

  validateFields(data: SubstationMasterData): void {
    data.items.forEach((item) => {
      expect(Number.isInteger(item.slNo)).toBeTruthy();
      expect(item.slNo).toBeGreaterThan(0);
      expect(item.substationName?.trim()).toBeTruthy();
      expect(Number.isInteger(item.dtrCount)).toBeTruthy();
      expect(Number.isInteger(item.consumerCount)).toBeTruthy();
      expect(item.dtrCount).toBeGreaterThanOrEqual(0);
      expect(item.consumerCount).toBeGreaterThanOrEqual(0);

      if (item.substationCode !== null) {
        expect(item.substationCode.trim()).not.toEqual("");
      }
    });
  }

  validatePagination(data: SubstationMasterData): void {
    MasterDataCommonValidator.validatePagination(data);
  }

  validateQueryParams(
    data: SubstationMasterData,
    query: SubstationMasterQuery,
  ): void {
    MasterDataCommonValidator.validateQueryParams(data, query);
  }

  validateSlNoSequence(data: SubstationMasterData): void {
    MasterDataCommonValidator.validateSlNoSequence(data);
  }

  validateRowKeysMatchColumns(data: SubstationMasterData): void {
    MasterDataCommonValidator.validateRowKeysMatchColumns(
      data.columns,
      data.items as unknown as Record<string, unknown>[],
    );
  }

  validateHierarchyFields(data: SubstationMasterData): void {
    data.items.forEach((item) => {
      if (item.zoneName !== null) {
        expect(item.zoneName.trim()).not.toEqual("");
      }
    });
  }

  validateConsumerDtrRelation(data: SubstationMasterData): void {
    data.items.forEach((item) => {
      if (item.consumerCount > 0) {
        expect(item.dtrCount).toBeGreaterThan(0);
      }
    });
  }

  validateUniqueSubstationNames(data: SubstationMasterData): void {
    const names = data.items.map((x) => x.substationName.trim());
    expect(new Set(names).size).toEqual(names.length);
  }

  validateAscendingSubstationOrder(data: SubstationMasterData): void {
    data.items.forEach((item, index) => {
      if (index > 0) {
        expect(
          item.substationName.localeCompare(
            data.items[index - 1].substationName,
          ),
        ).toBeGreaterThanOrEqual(0);
      }
    });
  }

  validateSearchResults(data: SubstationMasterData, searchTerm: string): void {
    const q = searchTerm.trim().toLowerCase();
    expect(q.length).toBeGreaterThan(0);
    data.items.forEach((item) => {
      const haystack = [
        item.substationName,
        item.substationCode ?? "",
        item.zoneName ?? "",
      ]
        .join(" ")
        .toLowerCase();
      expect(haystack.includes(q)).toBeTruthy();
    });
  }
}
