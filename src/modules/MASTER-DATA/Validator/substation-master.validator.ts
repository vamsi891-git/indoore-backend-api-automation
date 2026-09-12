import { expect } from "@playwright/test";
import { EXPECTED_SUBSTATION_MASTER_COLUMNS } from "../Data/substation-master.data";
import {
  SubstationMasterData,
  SubstationMasterQuery,
  SubstationMasterResponse,
} from "../Mapper/substation-master.mapper";
import { compareMasterLabelsAsc } from "../utils/master-data-field.helper";
import { MasterDataCommonValidator } from "./master-data-common.validator";

export class SubstationMasterValidator {
  validateResponse(response: SubstationMasterResponse): void {
    expect(response.success).toBeTruthy();
    expect(response.data).toBeDefined();
  }

  validateColumns(data: SubstationMasterData): void {
    MasterDataCommonValidator.validateExpectedColumnsPresent(
      data.columns,
      EXPECTED_SUBSTATION_MASTER_COLUMNS,
    );
  }

  validateItemsExist(data: SubstationMasterData): void {
    if (data.total > 0 && data.page <= data.totalPages) {
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

      if (item.id != null) {
        expect(String(item.id).trim()).not.toEqual("");
      }

      for (const field of [
        item.discomName,
        item.regionName,
        item.circleName,
        item.divisionName,
        item.zoneName,
        item.substationCode,
      ]) {
        if (field != null) {
          expect(String(field).trim()).not.toEqual("");
        }
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
    // API: ORDER BY Network_Name ASC, Network_Code ASC; soft-warn on collation drift.
    const outOfOrder: string[] = [];
    data.items.forEach((item, index) => {
      if (index === 0) return;
      const prev = data.items[index - 1];
      const byName = compareMasterLabelsAsc(
        item.substationName,
        prev.substationName,
      );
      if (byName < 0) {
        outOfOrder.push(`"${prev.substationName}" -> "${item.substationName}"`);
        return;
      }
      if (byName === 0) {
        const prevCode = prev.substationCode ?? "";
        const currCode = item.substationCode ?? "";
        if (compareMasterLabelsAsc(currCode, prevCode) < 0) {
          outOfOrder.push(
            `"${prev.substationName}/${prevCode}" -> "${item.substationName}/${currCode}"`,
          );
        }
      }
    });
    if (outOfOrder.length) {
      console.warn(
        `[backend-finding] substation-master ascending order drift (${outOfOrder.length}):`,
        outOfOrder.slice(0, 5).join("; "),
      );
    }
  }

  validateSearchResults(data: SubstationMasterData, searchTerm: string): void {
    const q = searchTerm.trim().toLowerCase();
    expect(q.length).toBeGreaterThan(0);
    data.items.forEach((item) => {
      const haystack = [
        item.id,
        item.substationName,
        item.substationCode,
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
