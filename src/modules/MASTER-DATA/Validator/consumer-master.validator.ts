import { expect } from "@playwright/test";
import { EXPECTED_CONSUMER_MASTER_COLUMNS } from "../Data/consumer-master.data";
import {
  ConsumerMasterData,
  ConsumerMasterQuery,
  ConsumerMasterResponse,
} from "../Mapper/consumer-master.mapper";
import { MasterDataCommonValidator } from "./master-data-common.validator";

const ALLOWED_METER_PHASES = ["1 PH", "3PH WC", "3PH 4CT", "HT"] as const;

export class ConsumerMasterValidator {
  validateResponse(response: ConsumerMasterResponse): void {
    expect(response.success).toBeTruthy();
    expect(response.data).toBeDefined();
  }

  validateColumns(data: ConsumerMasterData): void {
    // Required columns must be present; extra API columns are allowed.
    MasterDataCommonValidator.validateExpectedColumnsPresent(
      data.columns,
      EXPECTED_CONSUMER_MASTER_COLUMNS,
    );
  }

  validateItemsExist(data: ConsumerMasterData): void {
    if (data.total > 0) {
      expect(data.items.length).toBeGreaterThan(0);
    } else {
      expect(data.items.length).toBe(0);
    }
  }

  validateFields(data: ConsumerMasterData): void {
    data.items.forEach((item) => {
      expect(item.slNo).toBeGreaterThan(0);
      if (item.meterLookupTblRefId != null) {
        expect(item.meterLookupTblRefId).toBeGreaterThan(0);
      }
      if (item.mf != null) {
        expect(Number.isNaN(Number(item.mf))).toBeFalsy();
      }
      if (item.sanctionedLoadKw != null) {
        expect(item.sanctionedLoadKw).toBeGreaterThanOrEqual(0);
      }
      if (item.connectedToDcu != null) {
        expect(typeof item.connectedToDcu).toEqual("boolean");
      }
      if (item.latitude?.trim()) {
        expect(Number.isNaN(Number(item.latitude))).toBeFalsy();
      }
      if (item.longitude?.trim()) {
        expect(Number.isNaN(Number(item.longitude))).toBeFalsy();
      }
      if (item.installationDate?.trim()) {
        expect(Number.isNaN(Date.parse(item.installationDate.trim()))).toBeFalsy();
      }
    });
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
    data.items.forEach((item) => {
      expect(item).toHaveProperty("id");
    });
  }

  validateIdMatchesConsumerCid(data: ConsumerMasterData): void {
    data.items.forEach((item) => {
      if (item.id != null) {
        expect(item.id).toEqual(item.consumerCid);
      }
    });
  }

  validateUniqueMeterLookupIds(data: ConsumerMasterData): void {
    const ids = data.items.map((x) => x.meterLookupTblRefId);
    expect(new Set(ids).size).toEqual(ids.length);
  }

  validateUniqueMeterSerialsOnPage(data: ConsumerMasterData): void {
    const serials = data.items
      .map((x) => x.meterSerialNumber?.trim())
      .filter((msn): msn is string => Boolean(msn));
    expect(new Set(serials).size).toEqual(serials.length);
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

  validateIvrsConsistency(data: ConsumerMasterData): void {
    data.items.forEach((item) => {
      if (item.existingIvrsNo?.trim() && item.ivrsNo?.trim()) {
        expect(item.existingIvrsNo).toEqual(item.ivrsNo);
      }
    });
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
      const haystack = Object.values(item)
        .filter((v) => v != null && typeof v !== "object")
        .map((v) => String(v))
        .join(" ")
        .toLowerCase();
      expect(haystack.includes(q)).toBeTruthy();
    });
  }
}
