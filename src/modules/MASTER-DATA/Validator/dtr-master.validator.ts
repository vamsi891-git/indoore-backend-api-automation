import { expect } from "@playwright/test";
import {
  DtrMasterData,
  DtrMasterQuery,
  DtrMasterResponse,
} from "../Mapper/dtr-master.mapper";
import { MasterDataCommonValidator } from "./master-data-common.validator";

export class DtrMasterValidator {
  validateResponse(response: DtrMasterResponse): void {
    expect(response.success).toBeTruthy();
    expect(response.data).toBeDefined();
  }

  validateColumns(data: DtrMasterData): void {
    MasterDataCommonValidator.validateColumns(data.columns);
  }

  validateItemsExist(data: DtrMasterData): void {
    if (data.total > 0) {
      expect(data.items.length).toBeGreaterThan(0);
    } else {
      expect(data.items.length).toBe(0);
    }
  }

  validateFields(data: DtrMasterData): void {
    data.items.forEach((item) => {
      expect(Number.isInteger(item.slNo)).toBeTruthy();
      expect(item.slNo).toBeGreaterThan(0);
      expect(item.id?.trim()).toBeTruthy();
      expect(item.dtr?.trim()).toBeTruthy();
      expect(item.id).toEqual(item.dtr);

      for (const field of [
        item.circle,
        item.division,
        item.zone,
        item.subStation,
        item.feeder,
        item.meterSerialNumber,
        item.serviceDate,
      ]) {
        if (field !== null) {
          expect(field.trim()).not.toEqual("");
        }
      }

      if (item.mf !== null) {
        expect(item.mf.trim()).not.toEqual("");
        expect(Number.isNaN(Number(item.mf))).toBeFalsy();
      }
    });
  }

  validatePagination(data: DtrMasterData): void {
    MasterDataCommonValidator.validatePagination(data);
  }

  validateQueryParams(data: DtrMasterData, query: DtrMasterQuery): void {
    MasterDataCommonValidator.validateQueryParams(data, query);
  }

  validateSlNoSequence(data: DtrMasterData): void {
    MasterDataCommonValidator.validateSlNoSequence(data);
  }

  validateRowKeysMatchColumns(data: DtrMasterData): void {
    MasterDataCommonValidator.validateRowKeysMatchColumns(
      data.columns,
      data.items as unknown as Record<string, unknown>[],
    );
  }

  validateUniqueMeterSerials(data: DtrMasterData): void {
    const serials = data.items
      .map((x) => x.meterSerialNumber?.trim())
      .filter((msn): msn is string => Boolean(msn));
    expect(new Set(serials).size).toEqual(serials.length);
  }

  validateAscendingDtrOrder(data: DtrMasterData): void {
    data.items.forEach((item, index) => {
      if (index > 0) {
        expect(
          item.dtr.localeCompare(data.items[index - 1].dtr),
        ).toBeGreaterThanOrEqual(0);
      }
    });
  }

  validateCoordinates(data: DtrMasterData): void {
    data.items.forEach((item) => {
      if (item.latitude) {
        expect(Number.isNaN(Number(item.latitude))).toBeFalsy();
      }
      if (item.longitude) {
        expect(Number.isNaN(Number(item.longitude))).toBeFalsy();
      }
    });
  }

  validateSearchResults(data: DtrMasterData, searchTerm: string): void {
    const q = searchTerm.trim().toLowerCase();
    expect(q.length).toBeGreaterThan(0);
    data.items.forEach((item) => {
      const haystack = [item.dtr, item.meterSerialNumber ?? "", item.id]
        .join(" ")
        .toLowerCase();
      expect(haystack.includes(q)).toBeTruthy();
    });
  }
}
