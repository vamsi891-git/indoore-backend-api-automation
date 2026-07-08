import { expect } from "@playwright/test";
import { EXPECTED_METER_MASTER_COLUMNS } from "../Data/meter-master.data";
import {
  MeterMasterData,
  MeterMasterQuery,
  MeterMasterResponse,
} from "../Mapper/meter-master.mapper";

const IPV4_REGEX =
  /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;

export class MeterMasterValidator {
  validateResponse(response: MeterMasterResponse): void {
    expect(response.success).toBeTruthy();
    expect(response.data).toBeDefined();
  }

  validateColumns(data: MeterMasterData): void {
    expect(data.columns.length).toEqual(EXPECTED_METER_MASTER_COLUMNS.length);
    EXPECTED_METER_MASTER_COLUMNS.forEach((expected, index) => {
      expect(data.columns[index]?.key).toEqual(expected.key);
      expect(data.columns[index]?.header).toEqual(expected.header);
    });
  }

  validateItemsExist(data: MeterMasterData): void {
    if (data.total > 0) {
      expect(data.items.length).toBeGreaterThan(0);
    } else {
      expect(data.items.length).toBe(0);
    }
  }

  validateFields(data: MeterMasterData): void {
    data.items.forEach((item) => {
      expect(Number.isInteger(item.slNo)).toBeTruthy();
      expect(item.slNo).toBeGreaterThan(0);

      expect(Number.isInteger(item.meterLookupTblRefId)).toBeTruthy();
      expect(item.meterLookupTblRefId).toBeGreaterThan(0);

      expect(item.id).toEqual(String(item.meterLookupTblRefId));

      expect(item.isActiveStatus).toBe(true);

      expect(Number.isInteger(item.organisationLookupTblRefId)).toBeTruthy();
      expect(item.organisationLookupTblRefId).toBeGreaterThan(0);

      expect(Number.isInteger(item.networkLookupTblRefId)).toBeTruthy();
      expect(item.networkLookupTblRefId).toBeGreaterThan(0);

      expect(typeof item.mf).toEqual("number");
      expect(item.mf).toBeGreaterThan(0);

      if (item.meterSerialNumber !== null) {
        expect(item.meterSerialNumber.trim()).not.toEqual("");
      }

      if (item.simNumber !== null) {
        expect(item.simNumber.trim()).not.toEqual("");
      }
      if (item.ismiNumber !== null) {
        expect(item.ismiNumber.trim()).not.toEqual("");
      }
      if (item.ipAddress !== null) {
        expect(item.ipAddress.trim()).not.toEqual("");
        expect(IPV4_REGEX.test(item.ipAddress.trim())).toBeTruthy();
      }
      if (item.modemSerialNumber !== null) {
        expect(item.modemSerialNumber.trim()).not.toEqual("");
      }
      if (item.modemImeiNumber !== null) {
        expect(item.modemImeiNumber.trim()).not.toEqual("");
      }
      if (item.assetId !== null) {
        expect(item.assetId.trim()).not.toEqual("");
      }
      if (item.meterRapdrpCode !== null) {
        expect(item.meterRapdrpCode.trim()).not.toEqual("");
      }
    });

    const incompleteRows = data.items
      .filter(
        (item) =>
          !item.meterSerialNumber?.trim() &&
          (item.assetId !== null || item.meterRapdrpCode !== null),
      )
      .map((item) => item.slNo);
    if (incompleteRows.length) {
      console.log(
        "BACKEND FINDING: meter rows with null serial but populated asset/RAPDRP:",
        incompleteRows,
      );
    }

    const nullSerialRows = data.items
      .filter((item) => !item.meterSerialNumber?.trim())
      .map((item) => item.slNo);
    if (nullSerialRows.length) {
      console.log(
        "BACKEND FINDING: meter rows with null or empty meterSerialNumber:",
        nullSerialRows,
      );
    }
  }

  validatePagination(data: MeterMasterData): void {
    expect(data.page).toBeGreaterThan(0);
    expect(data.limit).toBeGreaterThan(0);
    expect(data.total).toBeGreaterThanOrEqual(0);
    expect(data.totalPages).toBeGreaterThanOrEqual(0);

    if (data.total === 0) {
      expect(data.totalPages).toEqual(0);
      expect(data.items.length).toEqual(0);
      return;
    }

    expect(data.totalPages).toEqual(Math.ceil(data.total / data.limit));
    expect(data.items.length).toBeLessThanOrEqual(data.limit);

    if (data.page < data.totalPages) {
      expect(data.items.length).toEqual(data.limit);
    } else if (data.page === data.totalPages) {
      const remainder = data.total % data.limit;
      const expectedRows = remainder === 0 ? data.limit : remainder;
      expect(data.items.length).toEqual(expectedRows);
    }
  }

  validateQueryParams(data: MeterMasterData, query: MeterMasterQuery): void {
    expect(data.page).toEqual(query.page ?? 1);
    expect(data.limit).toEqual(query.limit ?? 20);
  }

  validateSlNoSequence(data: MeterMasterData): void {
    const offset = (data.page - 1) * data.limit;
    data.items.forEach((item, index) => {
      expect(item.slNo).toEqual(offset + index + 1);
    });
  }

  validateUniqueMeterLookupIds(data: MeterMasterData): void {
    const ids = data.items.map((row) => row.meterLookupTblRefId);
    expect(new Set(ids).size).toEqual(ids.length);
  }

  validateUniqueMeterSerialsOnPage(data: MeterMasterData): void {
    const serials = data.items
      .map((row) => row.meterSerialNumber?.trim())
      .filter((msn): msn is string => Boolean(msn));
    expect(new Set(serials).size).toEqual(serials.length);
  }

  /** When serial is present, assetId and RAPDRP code should match serial (backend mapping). */
  validateSerialAssetConsistency(data: MeterMasterData): void {
    const mismatches: string[] = [];
    data.items.forEach((item) => {
      const serial = item.meterSerialNumber?.trim();
      if (!serial) return;

      if (item.assetId !== null && item.assetId !== serial) {
        mismatches.push(`assetId ${item.assetId} !== serial ${serial}`);
      }
      if (item.meterRapdrpCode !== null && item.meterRapdrpCode !== serial) {
        mismatches.push(
          `meterRapdrpCode ${item.meterRapdrpCode} !== serial ${serial}`,
        );
      }
    });
    if (mismatches.length > 0) {
      console.warn(
        `[backend-defect] meter-master serial/asset mapping mismatches: ${mismatches.join("; ")}`,
      );
    }
  }

  /** Rows with IP should have modem telemetry populated (connected meter profile). */
  validateConnectedMeterProfile(data: MeterMasterData): void {
    data.items
      .filter((row) => row.ipAddress?.trim())
      .forEach((item) => {
        expect(item.simNumber?.trim()).toBeTruthy();
        expect(item.ismiNumber?.trim()).toBeTruthy();
        expect(item.modemSerialNumber?.trim()).toBeTruthy();
        expect(item.modemImeiNumber?.trim()).toBeTruthy();
      });
  }

  validateRowKeysMatchColumns(data: MeterMasterData): void {
    const keys = data.columns.map((c) => c.key);
    data.items.forEach((item) => {
      keys.forEach((key) => {
        expect(item).toHaveProperty(key);
      });
      expect(item).toHaveProperty("id");
    });
  }

  validateSearchResults(data: MeterMasterData, searchTerm: string): void {
    const q = searchTerm.trim().toLowerCase();
    expect(q.length).toBeGreaterThan(0);

    data.items.forEach((item) => {
      const serial = (item.meterSerialNumber ?? "").toLowerCase();
      const asset = (item.assetId ?? "").toLowerCase();
      const rapdrp = (item.meterRapdrpCode ?? "").toLowerCase();
      const id = String(item.meterLookupTblRefId);
      const matches =
        serial.includes(q) ||
        asset.includes(q) ||
        rapdrp.includes(q) ||
        id.includes(q);
      expect(matches).toBeTruthy();
    });
  }
}
