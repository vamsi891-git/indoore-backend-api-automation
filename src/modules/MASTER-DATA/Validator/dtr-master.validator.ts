import { expect } from "@playwright/test";
import { EXPECTED_DTR_MASTER_COLUMNS } from "../Data/dtr-master.data";
import {
  DtrMasterData,
  DtrMasterQuery,
  DtrMasterResponse,
} from "../Mapper/dtr-master.mapper";
import { compareMasterLabelsAsc } from "../utils/master-data-field.helper";
import { MasterDataCommonValidator } from "./master-data-common.validator";

const SERVICE_DATE_RE = /^\d{4}-\d{2}-\d{2}/;

export class DtrMasterValidator {
  validateResponse(response: DtrMasterResponse): void {
    expect(response.success).toBeTruthy();
    expect(response.data).toBeDefined();
  }

  validateColumns(data: DtrMasterData): void {
    MasterDataCommonValidator.validateExpectedColumnsPresent(
      data.columns,
      EXPECTED_DTR_MASTER_COLUMNS,
    );
  }

  validateItemsExist(data: DtrMasterData): void {
    if (data.total > 0 && data.page <= data.totalPages) {
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
      expect(
        firstNonEmpty(item.dtrCode, item.dtrName, item.newDtrCode),
      ).toBeTruthy();

      if (item.meterLookupTblRefId != null) {
        expect(item.id).toEqual(String(item.meterLookupTblRefId));
      }

      for (const field of [
        item.circle,
        item.division,
        item.zone,
        item.subStation,
        item.feeder,
        item.feederCode,
        item.feederName,
        item.dtrCode,
        item.dtrName,
        item.newDtrCode,
        item.dtrCapacity,
        item.meterSerialNumber,
        item.meterMake,
        item.serviceDate,
      ]) {
        if (field != null) {
          expect(String(field).trim()).not.toEqual("");
        }
      }

      if (item.mf != null) {
        expect(String(item.mf).trim()).not.toEqual("");
        expect(Number.isNaN(Number(item.mf))).toBeFalsy();
      }

      if (item.serviceDate != null && item.serviceDate.trim() !== "") {
        expect(SERVICE_DATE_RE.test(item.serviceDate.trim())).toBeTruthy();
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
    // Matches API: coded DTRs first, then DTR Name, CODE, meter serial, id.
    const sortKey = (item: (typeof data.items)[number]) => {
      const code = (item.dtrCode ?? "").trim();
      const name = (item.dtrName ?? item.dtr ?? "").trim();
      const serial = (item.meterSerialNumber ?? "").trim();
      return {
        codedRank: code ? 0 : 1,
        name,
        code,
        serial,
        id: item.id ?? "",
      };
    };

    data.items.forEach((item, index) => {
      if (index === 0) return;
      const prev = sortKey(data.items[index - 1]);
      const curr = sortKey(item);
      if (curr.codedRank !== prev.codedRank) {
        expect(curr.codedRank).toBeGreaterThanOrEqual(prev.codedRank);
        return;
      }
      const byName = compareMasterLabelsAsc(curr.name, prev.name);
      if (byName !== 0) {
        expect(byName).toBeGreaterThanOrEqual(0);
        return;
      }
      const byCode = compareMasterLabelsAsc(curr.code, prev.code);
      if (byCode !== 0) {
        expect(byCode).toBeGreaterThanOrEqual(0);
        return;
      }
      const bySerial = compareMasterLabelsAsc(curr.serial, prev.serial);
      if (bySerial !== 0) {
        expect(bySerial).toBeGreaterThanOrEqual(0);
        return;
      }
      expect(compareMasterLabelsAsc(curr.id, prev.id)).toBeGreaterThanOrEqual(0);
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
      const haystack = [
        item.dtr,
        item.dtrCode,
        item.dtrName,
        item.newDtrCode,
        item.feeder,
        item.feederCode,
        item.feederName,
        item.meterSerialNumber,
        item.meterMake,
        item.id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      expect(haystack.includes(q)).toBeTruthy();
    });
  }
}

function firstNonEmpty(
  ...values: Array<string | null | undefined>
): string | undefined {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return undefined;
}
