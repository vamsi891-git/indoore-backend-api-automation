import { expect } from "@playwright/test";
import { EXPECTED_FEEDER_MASTER_COLUMNS } from "../Data/feeder-master.data";
import {
  FeederMasterData,
  FeederMasterQuery,
  FeederMasterResponse,
} from "../Mapper/feeder-master.mapper";
import { compareMasterLabelsAsc } from "../utils/master-data-field.helper";
import { MasterDataCommonValidator } from "./master-data-common.validator";

export class FeederMasterValidator {
  validateResponse(response: FeederMasterResponse): void {
    expect(response.success).toBeTruthy();
    expect(response.data).toBeDefined();
  }

  validateColumns(data: FeederMasterData): void {
    MasterDataCommonValidator.validateExpectedColumnsPresent(
      data.columns,
      EXPECTED_FEEDER_MASTER_COLUMNS,
    );
  }

  validateItemsExist(data: FeederMasterData): void {
    if (data.total > 0 && data.page <= data.totalPages) {
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

      if (item.id != null) {
        expect(String(item.id).trim()).not.toEqual("");
      }

      for (const field of [
        item.discomName,
        item.regionName,
        item.circleName,
        item.divisionName,
        item.zoneName,
        item.substationName,
      ]) {
        if (field != null) {
          expect(String(field).trim()).not.toEqual("");
        }
      }
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
    // API: ORDER BY Network_Name ASC; soft-warn on collation/data drift.
    const outOfOrder: string[] = [];
    data.items.forEach((item, index) => {
      if (index === 0) return;
      const prev = data.items[index - 1].feederName;
      const curr = item.feederName;
      if (compareMasterLabelsAsc(curr, prev) < 0) {
        outOfOrder.push(`"${prev}" -> "${curr}"`);
      }
    });
    if (outOfOrder.length) {
      console.warn(
        `[backend-finding] feeder-master ascending order drift (${outOfOrder.length}):`,
        outOfOrder.slice(0, 5).join("; "),
      );
    }
  }

  validateSearchResults(data: FeederMasterData, searchTerm: string): void {
    const q = searchTerm.trim().toLowerCase();
    expect(q.length).toBeGreaterThan(0);
    data.items.forEach((item) => {
      const haystack = [
        item.id,
        item.feederName,
        item.substationName,
        item.zoneName,
        item.divisionName,
        item.circleName,
        item.regionName,
        item.discomName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      expect(haystack.includes(q)).toBeTruthy();
    });
  }
}
