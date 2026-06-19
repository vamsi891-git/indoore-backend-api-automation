import { expect } from "@playwright/test";
import {
  ConsumerMasterData,
  ConsumerMasterQuery,
  ConsumerMasterResponse,
} from "../Mapper/consumer-master.mapper";
import { MasterDataCommonValidator } from "./master-data-common.validator";

const ALLOWED_METER_PHASES = ["1 PH", "3PH WC", "HT"] as const;

export class ConsumerMasterValidator {
  validateResponse(response: ConsumerMasterResponse): void {
    expect(response.success).toBeTruthy();
    expect(response.data).toBeDefined();
  }

  validateColumns(data: ConsumerMasterData): void {
    MasterDataCommonValidator.validateColumns(data.columns);
  }

  validateItemsExist(data: ConsumerMasterData): void {
    if (data.total > 0) {
      expect(data.items.length).toBeGreaterThan(0);
    } else {
      expect(data.items.length).toBe(0);
    }
  }

  validateFields(data: ConsumerMasterData): void {
    const incompleteRows: number[] = [];

    data.items.forEach((item) => {
      expect(Number.isInteger(item.slNo)).toBeTruthy();
      expect(item.slNo).toBeGreaterThan(0);
      expect(item.meterLookupTblRefId).toBeGreaterThan(0);

      if (!item.consumerCid?.trim() || !item.consumerName?.trim()) {
        incompleteRows.push(item.slNo);
        return;
      }

      if (item.meterSerialNumber?.trim()) {
        expect(item.meterSerialNumber.trim()).not.toEqual("");
      }
      if (item.meterPhase?.trim()) {
        expect(item.meterPhase.trim()).not.toEqual("");
      }

      if (item.mf != null) {
        expect(item.mf).toBeGreaterThan(0);
      }
      if (item.lsCount != null) {
        expect(item.lsCount).toBeGreaterThanOrEqual(0);
      }
      if (item.dpCount != null) {
        expect(item.dpCount).toBeGreaterThanOrEqual(0);
      }
      if (item.connectedToDcu != null) {
        expect(typeof item.connectedToDcu).toEqual("boolean");
      }
      if (item.latitude != null) {
        expect(Number.isNaN(Number(item.latitude))).toBeFalsy();
      }
      if (item.longitude != null) {
        expect(Number.isNaN(Number(item.longitude))).toBeFalsy();
      }
    });

    if (incompleteRows.length) {
      console.log(
        "BACKEND FINDING: consumer rows with empty consumerCid or consumerName:",
        incompleteRows,
      );
    }

    if (data.total > 0) {
      const completeRows = data.items.filter(
        (item) => item.consumerCid?.trim() && item.consumerName?.trim(),
      );
      expect(completeRows.length).toBeGreaterThan(0);
    }
  }

  validatePagination(data: ConsumerMasterData): void {
    MasterDataCommonValidator.validatePagination(data);
  }

  validateQueryParams(data: ConsumerMasterData, query: ConsumerMasterQuery): void {
    MasterDataCommonValidator.validateQueryParams(data, query);
  }

  validateSlNoSequence(data: ConsumerMasterData): void {
    MasterDataCommonValidator.validateSlNoSequence(data);
  }

  validateRowKeysMatchColumns(data: ConsumerMasterData): void {
    MasterDataCommonValidator.validateRowKeysMatchColumns(
      data.columns,
      data.items as unknown as Record<string, unknown>[],
    );
  }

  validateUniqueMeterLookupIds(data: ConsumerMasterData): void {
    const ids = data.items.map((x) => x.meterLookupTblRefId);
    expect(new Set(ids).size).toEqual(ids.length);
  }

  validateUniqueConsumerCids(data: ConsumerMasterData): void {
    const cids = data.items.map((x) => x.consumerCid.trim());
    const duplicates = cids.filter((cid, index) => cids.indexOf(cid) !== index);
    if (duplicates.length) {
      console.log(
        "Duplicate consumer CIDs on page (multiple meters per consumer):",
        duplicates.length,
        [...new Set(duplicates)],
      );
    }
  }

  validateMeterPhases(data: ConsumerMasterData): void {
    const allowed = [...ALLOWED_METER_PHASES];
    data.items.forEach((item) => {
      if (!item.meterPhase?.trim()) return;
      expect(allowed).toContain(item.meterPhase);
    });
  }

  validateHierarchyFields(data: ConsumerMasterData): void {
    data.items.forEach((item) => {
      for (const field of [item.division, item.zone, item.feeder, item.dtr]) {
        if (field !== null && field !== undefined) {
          expect(field.trim()).not.toEqual("");
        }
      }
    });
  }

  validateSearchResults(data: ConsumerMasterData, searchTerm: string): void {
    const q = searchTerm.trim().toLowerCase();
    expect(q.length).toBeGreaterThan(0);
    data.items.forEach((item) => {
      const haystack = [
        item.consumerCid,
        item.consumerName,
        item.meterSerialNumber,
        item.ivrsNo,
      ]
        .join(" ")
        .toLowerCase();
      expect(haystack.includes(q)).toBeTruthy();
    });
  }
}
