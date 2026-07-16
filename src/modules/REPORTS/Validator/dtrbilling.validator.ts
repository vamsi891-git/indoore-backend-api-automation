import { expect } from "@playwright/test";
import {
  DtrBillingReportData,
  DtrBillingResponse,
  DtrBillingRow,
} from "../Mapper/dtrbilling.mapper";

export interface DtrBillingErrorBody {
  success: boolean;
  error?: { code?: string; message?: string };
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const DMY_DATE_TIME = /^\d{2}-\d{2}-\d{4} \d{2}:\d{2}$/;

const EXPECTED_COLUMN_KEYS = [
  "slNo",
  "circle",
  "division",
  "zone",
  "subStation",
  "feeder",
  "dtr",
  "meterSerialNumber",
  "meterTime",
  "billingDate",
  "kwhImp",
  "kwhExp",
  "kvahImp",
  "kvahExp",
  "kwImp",
  "kwDateTime",
  "kvaImp",
  "kvaDateTime",
  "mf",
] as const;

function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function parseDmyDateTime(value: string): Date {
  const [datePart, timePart] = value.split(" ");
  const [day, month, year] = datePart.split("-").map(Number);
  const [hour, minute] = (timePart ?? "00:00").split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute);
}

function parseNumericString(value: string): number {
  return Number.parseFloat(value);
}

export class DtrBillingValidator {
  validateValidationError(responseBody: DtrBillingErrorBody): void {
    expect(responseBody.success).toBeFalsy();
    expect(responseBody.error).toBeDefined();
    expect(responseBody.error?.code).toBe("VALIDATION_ERROR");
    expect(responseBody.error?.message).toBeTruthy();
  }

  validateApiError(responseBody: DtrBillingErrorBody): void {
    expect(responseBody.success).toBeFalsy();
    expect(responseBody.error).toBeDefined();
    expect(responseBody.error?.code).toBeTruthy();
    expect(responseBody.error?.message).toBeTruthy();
  }

  validateSuccess(response: DtrBillingResponse) {
    expect(response.success).toBeTruthy();
  }

  validateRootStructure(response: DtrBillingResponse) {
    expect(response.data).toBeDefined();
    expect(Array.isArray(response.data.columns)).toBeTruthy();
    expect(Array.isArray(response.data.rows)).toBeTruthy();
    expect(response.data.pagination).toBeDefined();
  }

  validateColumns(data: DtrBillingReportData) {
    expect(data.columns.length).toBeGreaterThan(0);
    const keys = data.columns.map((column) => column.key);
    for (const key of EXPECTED_COLUMN_KEYS) {
      expect(keys).toContain(key);
    }
  }

  validateQueryEcho(data: DtrBillingReportData, page: number, limit: number) {
    expect(data.pagination.page).toBe(page);
    expect(data.pagination.limit).toBe(limit);
  }

  validateDateRangeFormat(fromDate: string, toDate: string) {
    expect(ISO_DATE.test(fromDate)).toBeTruthy();
    expect(ISO_DATE.test(toDate)).toBeTruthy();
    expect(parseIsoDate(fromDate).getTime()).toBeLessThanOrEqual(
      parseIsoDate(toDate).getTime(),
    );
  }

  validatePagination(data: DtrBillingReportData, includeTotal = true) {
    const { page, limit, total, totalPages } = data.pagination;
    expect(page).toBeGreaterThan(0);
    expect(limit).toBeGreaterThan(0);
    expect(total).toBeGreaterThanOrEqual(0);
    expect(totalPages).toBeGreaterThanOrEqual(0);
    expect(data.rows.length).toBeLessThanOrEqual(limit);

    if (total === 0) {
      expect(data.rows.length).toBe(0);
      expect(totalPages).toBe(0);
      return;
    }

    expect(total).toBeGreaterThanOrEqual(data.rows.length);

    // With includeTotal=false the API may echo page size as total while
    // totalPages reflects a larger estimated set — skip exact page math then.
    if (includeTotal) {
      expect(totalPages).toBe(Math.ceil(total / limit));
    } else {
      expect(totalPages).toBeGreaterThanOrEqual(1);
      if (data.rows.length < limit) {
        expect(totalPages).toBe(page);
      }
    }
  }

  validateRowsStructure(rows: DtrBillingRow[]) {
    for (const row of rows) {
      expect(typeof row.slNo).toBe("number");
      expect(typeof row.circle).toBe("string");
      expect(typeof row.division).toBe("string");
      expect(typeof row.zone).toBe("string");
      expect(typeof row.subStation).toBe("string");
      expect(typeof row.feeder).toBe("string");
      expect(typeof row.dtr).toBe("string");
      expect(typeof row.meterSerialNumber).toBe("string");
      expect(typeof row.meterTime).toBe("string");
      expect(typeof row.billingDate).toBe("string");
      expect(typeof row.kwhImp).toBe("string");
      expect(typeof row.kwhExp).toBe("string");
      expect(typeof row.kvahImp).toBe("string");
      expect(typeof row.kvahExp).toBe("string");
      expect(typeof row.kwImp).toBe("string");
      expect(typeof row.kvaImp).toBe("string");
      expect(typeof row.mf).toBe("string");
      expect(
        row.kwDateTime === null || typeof row.kwDateTime === "string",
      ).toBeTruthy();
      expect(
        row.kvaDateTime === null || typeof row.kvaDateTime === "string",
      ).toBeTruthy();
    }
  }

  validateHierarchyFields(rows: DtrBillingRow[]) {
    for (const row of rows) {
      expect(row.circle.trim()).not.toEqual("");
      expect(row.division.trim()).not.toEqual("");
      expect(row.zone.trim()).not.toEqual("");
      expect(row.subStation.trim()).not.toEqual("");
      expect(row.feeder.trim()).not.toEqual("");
      expect(row.dtr.trim()).not.toEqual("");
    }
  }

  validateMeterSerialNumber(rows: DtrBillingRow[]) {
    for (const row of rows) {
      expect(row.meterSerialNumber.trim()).not.toEqual("");
      expect(row.meterSerialNumber.trim().length).toBeGreaterThan(0);
    }
  }

  validateDateTimeFormat(rows: DtrBillingRow[]) {
    for (const row of rows) {
      expect(DMY_DATE_TIME.test(row.meterTime)).toBeTruthy();
      expect(DMY_DATE_TIME.test(row.billingDate)).toBeTruthy();

      if (row.kwDateTime != null) {
        expect(DMY_DATE_TIME.test(row.kwDateTime)).toBeTruthy();
      }

      if (row.kvaDateTime != null) {
        expect(DMY_DATE_TIME.test(row.kvaDateTime)).toBeTruthy();
      }
    }
  }

  validateBillingDateInRange(
    rows: DtrBillingRow[],
    fromDate: string,
    toDate: string,
  ) {
    const start = parseIsoDate(fromDate);
    const end = parseIsoDate(toDate);
    end.setHours(23, 59, 59, 999);

    for (const row of rows) {
      const billing = parseDmyDateTime(row.billingDate);
      expect(billing.getTime()).toBeGreaterThanOrEqual(start.getTime());
      expect(billing.getTime()).toBeLessThanOrEqual(end.getTime());
    }
  }

  validateEnergyFields(rows: DtrBillingRow[]) {
    for (const row of rows) {
      for (const field of [
        row.kwhImp,
        row.kwhExp,
        row.kvahImp,
        row.kvahExp,
        row.kwImp,
        row.kvaImp,
      ]) {
        const value = parseNumericString(field);
        expect(Number.isNaN(value)).toBeFalsy();
        expect(value).toBeGreaterThanOrEqual(0);
      }
    }
  }

  validateElectricalBusinessRules(rows: DtrBillingRow[]) {
    for (const row of rows) {
      const kwhImp = parseNumericString(row.kwhImp);
      const kvahImp = parseNumericString(row.kvahImp);
      const kwImp = parseNumericString(row.kwImp);
      const kvaImp = parseNumericString(row.kvaImp);

      expect(kvahImp).toBeGreaterThanOrEqual(kwhImp);
      expect(kvaImp).toBeGreaterThanOrEqual(kwImp);
    }
  }

  validateExportEnergy(rows: DtrBillingRow[]) {
    for (const row of rows) {
      expect(parseNumericString(row.kwhExp)).toBeGreaterThanOrEqual(0);
      expect(parseNumericString(row.kvahExp)).toBeGreaterThanOrEqual(0);
    }
  }

  validateMf(rows: DtrBillingRow[]) {
    for (const row of rows) {
      const mf = parseNumericString(row.mf);
      expect(Number.isNaN(mf)).toBeFalsy();
      expect(mf).toBeGreaterThan(0);
    }
  }

  validateSlNoSequence(rows: DtrBillingRow[], page: number, limit: number) {
    const expectedStart = (page - 1) * limit + 1;

    rows.forEach((row, index) => {
      expect(row.slNo).toBe(expectedStart + index);
    });
  }

  validateUniqueSlNo(rows: DtrBillingRow[]) {
    const slNos = rows.map((row) => row.slNo);
    expect(new Set(slNos).size).toBe(slNos.length);
  }

  validateUniqueMeterSerial(rows: DtrBillingRow[]) {
    const serials = rows.map((row) => row.meterSerialNumber);
    expect(new Set(serials).size).toBe(serials.length);
  }

  validateNoDataScenario(data: DtrBillingReportData) {
    if (data.pagination.total === 0) {
      expect(data.rows.length).toBe(0);
      expect(data.pagination.totalPages).toBe(0);
    }
  }

  validateRowsPresentWhenTotalPositive(data: DtrBillingReportData) {
    if (data.pagination.total > 0 && data.pagination.page === 1) {
      expect(data.rows.length).toBeGreaterThan(0);
    }
  }
}
