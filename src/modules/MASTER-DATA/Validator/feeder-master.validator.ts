import { expect } from "@playwright/test";
import {
  FeederMasterData,
  FeederMasterQuery,
  FeederMasterResponse,
} from "../Mapper/feeder-master.mapper";
import { MasterDataCommonValidator } from "./master-data-common.validator";

export class FeederMasterValidator {
  validateResponse(response: FeederMasterResponse): void {
    expect(response.success).toBeTruthy();
    expect(response.data).toBeDefined();
  }

  validateColumns(data: FeederMasterData): void {
    MasterDataCommonValidator.validateColumns(data.columns);
  }

  validateItemsExist(data: FeederMasterData): void {
    if (data.total > 0) {
      expect(data.items.length).toBeGreaterThan(0);
    } else {
      expect(data.items.length).toBe(0);
    }
  }

  validateFields(data: FeederMasterData): void {
    data.items.forEach((item) => {
      expect(Number.isInteger(item.slNo)).toBeTruthy();
      expect(item.slNo).toBeGreaterThan(0);
      expect(item.feederName?.trim()).toBeTruthy();
      expect(Number.isInteger(item.dtrCount)).toBeTruthy();
      expect(Number.isInteger(item.consumerCount)).toBeTruthy();
      expect(item.dtrCount).toBeGreaterThanOrEqual(0);
      expect(item.consumerCount).toBeGreaterThanOrEqual(0);
    });
  }

  validatePagination(data: FeederMasterData): void {
    MasterDataCommonValidator.validatePagination(data);
  }

  validateQueryParams(data: FeederMasterData, query: FeederMasterQuery): void {
    MasterDataCommonValidator.validateQueryParams(data, query);
  }

  validateSlNoSequence(data: FeederMasterData): void {
    MasterDataCommonValidator.validateSlNoSequence(data);
  }

  validateRowKeysMatchColumns(data: FeederMasterData): void {
    MasterDataCommonValidator.validateRowKeysMatchColumns(
      data.columns,
      data.items as unknown as Record<string, unknown>[],
    );
  }

  validateHierarchyFields(data: FeederMasterData): void {
    data.items.forEach((item) => {
      if (item.zoneName !== null) {
        expect(item.zoneName.trim()).not.toEqual("");
      }
      if (item.substationName !== null) {
        expect(item.substationName.trim()).not.toEqual("");
      }
    });
  }

  validateConsumerDtrRelation(data: FeederMasterData): void {
    data.items.forEach((item) => {
      if (item.consumerCount > 0) {
        expect(item.dtrCount).toBeGreaterThan(0);
      }
    });
  }

  validateUniqueFeederNames(data: FeederMasterData): void {
    const names = data.items.map((x) => x.feederName.trim());
    expect(new Set(names).size).toEqual(names.length);
  }

  validateAscendingFeederOrder(data: FeederMasterData): void {
    data.items.forEach((item, index) => {
      if (index > 0) {
        expect(
          item.feederName.localeCompare(data.items[index - 1].feederName),
        ).toBeGreaterThanOrEqual(0);
      }
    });
  }

  validateSearchResults(data: FeederMasterData, searchTerm: string): void {
    const q = searchTerm.trim().toLowerCase();
    expect(q.length).toBeGreaterThan(0);
    data.items.forEach((item) => {
      const haystack = [
        item.feederName,
        item.substationName ?? "",
        item.zoneName ?? "",
      ]
        .join(" ")
        .toLowerCase();
      expect(haystack.includes(q)).toBeTruthy();
    });
  }
}
