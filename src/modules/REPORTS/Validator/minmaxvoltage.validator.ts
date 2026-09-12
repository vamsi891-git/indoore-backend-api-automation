import { expect } from "@playwright/test";
import {
  minMaxVoltageDefaultLimit,
  minMaxVoltageDefaultPage,
  minMaxVoltageExpectedColumns,
} from "../Data/minmaxvoltage.data";
import type {
  MappedMinMaxVoltage,
  MinMaxVoltageErrorBody,
  MinMaxVoltageResponse,
  MinMaxVoltageRow,
  MinMaxVoltageScenario,
} from "../Mapper/minmaxvoltage.mapper";
import { minMaxVoltageColumnKeys } from "../Mapper/minmaxvoltage.mapper";

/** Live: `217.300` */
const VOLTAGE_DECIMAL = /^-?\d+(\.\d+)?$/;
/** Live: `14-10-2025 11:45` */
const METER_READING_DT = /^\d{2}-\d{2}-\d{4} \d{2}:\d{2}$/;

export class MinMaxVoltageValidator {
  validateResponseEnvelope(response: MinMaxVoltageResponse): void {
    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
  }

  validateValidationError(responseBody: MinMaxVoltageErrorBody): void {
    expect(responseBody.success).toBeFalsy();
    expect(responseBody.error).toBeDefined();
    expect(responseBody.error?.code).toBe("VALIDATION_ERROR");
    expect(responseBody.error?.message).toBeTruthy();
  }

  validateSuccess(mapped: MappedMinMaxVoltage): void {
    expect(mapped.success).toBeTruthy();
  }

  validateRootStructure(mapped: MappedMinMaxVoltage): void {
    expect(Array.isArray(mapped.columns)).toBeTruthy();
    expect(Array.isArray(mapped.rows)).toBeTruthy();
    expect(mapped.pagination).toBeDefined();
    expect(typeof mapped.pagination.page).toBe("number");
    expect(typeof mapped.pagination.limit).toBe("number");
    expect(typeof mapped.pagination.total).toBe("number");
    expect(typeof mapped.pagination.totalPages).toBe("number");
  }

  validateColumns(mapped: MappedMinMaxVoltage): void {
    expect(mapped.columns.length).toBe(minMaxVoltageExpectedColumns.length);
    const keys = mapped.columns.map((column) => column.key);
    for (const expected of minMaxVoltageExpectedColumns) {
      expect(keys).toContain(expected.key);
      const column = mapped.columns.find((c) => c.key === expected.key);
      expect(column?.header).toBe(expected.header);
      expect(minMaxVoltageColumnKeys).toContain(expected.key);
    }
  }

  validatePaginationEcho(
    mapped: MappedMinMaxVoltage,
    page: number,
    limit: number,
  ): void {
    expect(mapped.pagination.page).toBe(page);
    expect(mapped.pagination.limit).toBe(limit);
  }

  validatePaginationBounds(mapped: MappedMinMaxVoltage): void {
    expect(mapped.pagination.page).toBeGreaterThan(0);
    expect(mapped.pagination.limit).toBeGreaterThan(0);
    expect(mapped.pagination.total).toBeGreaterThanOrEqual(0);
    expect(mapped.pagination.totalPages).toBeGreaterThanOrEqual(0);
    expect(mapped.rows.length).toBeLessThanOrEqual(mapped.pagination.limit);
  }

  validatePaginationMath(mapped: MappedMinMaxVoltage): void {
    const { total, limit, totalPages, totalIsExact, hasMore, page } =
      mapped.pagination;
    const { rows } = mapped;
    if (total === 0) {
      expect(rows.length).toBe(0);
      expect(totalPages).toBe(0);
      if (hasMore != null) expect(hasMore).toBe(false);
      return;
    }
    expect(totalPages).toBe(Math.ceil(total / limit));
    expect(total).toBeGreaterThanOrEqual(rows.length);
    if (totalIsExact != null) expect(typeof totalIsExact).toBe("boolean");
    if (hasMore != null) expect(hasMore).toBe(page < totalPages);
    if (mapped.pagination.nextCursor !== undefined) {
      expect(
        mapped.pagination.nextCursor === null ||
          typeof mapped.pagination.nextCursor === "string",
      ).toBeTruthy();
    }
  }

  validateRowsLimit(mapped: MappedMinMaxVoltage): void {
    expect(mapped.rows.length).toBeLessThanOrEqual(mapped.pagination.limit);
  }

  validateNoDataScenario(mapped: MappedMinMaxVoltage): void {
    if (mapped.pagination.total === 0) {
      expect(mapped.rows.length).toBe(0);
    }
  }

  validatePageBeyondTotal(
    mapped: MappedMinMaxVoltage,
    requestedPage: number,
  ): void {
    if (
      mapped.pagination.totalPages > 0 &&
      requestedPage > mapped.pagination.totalPages
    ) {
      expect(mapped.rows.length).toBe(0);
    }
  }

  validateRowsStructure(rows: MinMaxVoltageRow[]): void {
    for (const row of rows) {
      expect(typeof row.id).toBe("string");
      expect(typeof row.slNo).toBe("number");
      expect(typeof row.circle).toBe("string");
      expect(typeof row.division).toBe("string");
      expect(typeof row.zone).toBe("string");
      expect(typeof row.subStation).toBe("string");
      expect(typeof row.feeder).toBe("string");
      expect(typeof row.dtr).toBe("string");
      expect(
        typeof row.sanctionedLoadKw === "string" ||
          typeof row.sanctionedLoadKw === "number",
      ).toBeTruthy();
      expect(typeof row.name).toBe("string");
      expect(typeof row.address).toBe("string");
      expect(typeof row.ivrsNumber).toBe("string");
      expect(typeof row.category).toBe("string");
      expect(typeof row.meterSerialNumber).toBe("string");
      expect(typeof row.phase).toBe("string");
      expect(typeof row.voltage).toBe("string");
      expect(typeof row.meterReadingDateTime).toBe("string");
    }
  }

  /** Live ids: `row-{slNo}-{meterSerialNumber}`. */
  validateRowIds(rows: MinMaxVoltageRow[]): void {
    for (const row of rows) {
      expect(row.id).toBe(`row-${row.slNo}-${row.meterSerialNumber}`);
    }
  }

  validateMeterAndVoltageFields(rows: MinMaxVoltageRow[]): void {
    for (const row of rows) {
      expect(row.meterSerialNumber.trim().length).toBeGreaterThan(0);
      expect(row.phase.trim().length).toBeGreaterThan(0);
      expect(VOLTAGE_DECIMAL.test(row.voltage.trim())).toBeTruthy();
      expect(METER_READING_DT.test(row.meterReadingDateTime.trim())).toBeTruthy();
    }
  }

  /** Hierarchy / consumer labels may be blank on archive-only meters. */
  validateOptionalLabels(rows: MinMaxVoltageRow[]): void {
    for (const row of rows) {
      expect(typeof row.circle).toBe("string");
      expect(typeof row.division).toBe("string");
      expect(typeof row.zone).toBe("string");
      expect(typeof row.subStation).toBe("string");
      expect(typeof row.feeder).toBe("string");
      expect(typeof row.dtr).toBe("string");
      expect(typeof row.name).toBe("string");
      expect(typeof row.address).toBe("string");
      expect(typeof row.ivrsNumber).toBe("string");
      expect(typeof row.category).toBe("string");
    }
  }

  validateSlNoSequence(
    rows: MinMaxVoltageRow[],
    page: number,
    limit: number,
  ): void {
    const base = (page - 1) * limit;
    rows.forEach((row, index) => {
      expect(row.slNo).toBe(base + index + 1);
    });
  }

  /**
   * Same feeder / DTR / consumer category / phase label (e.g. 3PH 4CT)
   * on many meters is valid. Voltage and reading time are not unique.
   * Duplicate id, slNo, or meter serial on one page is a fail.
   */
  validateUniqueMeters(rows: MinMaxVoltageRow[]): void {
    const ids = rows.map((row) => row.id);
    const slNos = rows.map((row) => row.slNo);
    const serials = rows.map((row) => row.meterSerialNumber);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(slNos).size).toBe(slNos.length);
    expect(new Set(serials).size).toBe(serials.length);
  }

  validateLiveOk(
    mapped: MappedMinMaxVoltage,
    page = minMaxVoltageDefaultPage,
    limit = minMaxVoltageDefaultLimit,
  ): void {
    this.validateSuccess(mapped);
    this.validateRootStructure(mapped);
    this.validateColumns(mapped);
    this.validatePaginationEcho(mapped, page, limit);
    this.validatePaginationBounds(mapped);
    this.validatePaginationMath(mapped);
    this.validateRowsLimit(mapped);
    this.validateNoDataScenario(mapped);
    if (mapped.rows.length > 0) {
      this.validateRowsStructure(mapped.rows);
      this.validateRowIds(mapped.rows);
      this.validateMeterAndVoltageFields(mapped.rows);
      this.validateOptionalLabels(mapped.rows);
      this.validateSlNoSequence(mapped.rows, page, limit);
      this.validateUniqueMeters(mapped.rows);
    }
  }

  validateLiveFullContract(mapped: MappedMinMaxVoltage): void {
    this.validateLiveOk(mapped);
    expect(mapped.pagination.total).toBe(10);
    expect(mapped.pagination.totalPages).toBe(1);
    expect(mapped.pagination.totalIsExact).toBe(true);
    expect(mapped.pagination.hasMore).toBe(false);
    expect(mapped.rows.length).toBe(2);
    expect(mapped.rows[0]?.meterSerialNumber).toBe("22253936");
    expect(mapped.rows[0]?.voltage).toBe("217.300");
    expect(mapped.rows[0]?.circle).toBe("Indore city circle");
    expect(mapped.rows[1]?.meterSerialNumber).toBe("19272218");
    expect(mapped.rows[0]?.phase).toBe(mapped.rows[1]?.phase);
    expect(mapped.rows[0]?.meterSerialNumber).not.toBe(
      mapped.rows[1]?.meterSerialNumber,
    );
  }

  validateEmptyPageContract(mapped: MappedMinMaxVoltage): void {
    this.validateLiveOk(mapped);
    expect(mapped.pagination.total).toBe(0);
    expect(mapped.rows.length).toBe(0);
  }

  validatePageBeyondLive(
    mapped: MappedMinMaxVoltage,
    requestedPage: number,
  ): void {
    this.validateSuccess(mapped);
    this.validateRootStructure(mapped);
    this.validateColumns(mapped);
    this.validatePaginationBounds(mapped);
    this.validatePaginationMath(mapped);
    this.validatePageBeyondTotal(mapped, requestedPage);
    if (mapped.rows.length > 0) {
      this.validateUniqueMeters(mapped.rows);
    }
  }

  validateScenario(
    mapped: MappedMinMaxVoltage,
    scenario: MinMaxVoltageScenario,
    page = minMaxVoltageDefaultPage,
    limit = minMaxVoltageDefaultLimit,
  ): void {
    switch (scenario) {
      case "contract_live_full":
        this.validateLiveFullContract(mapped);
        break;
      case "contract_empty_page":
        this.validateEmptyPageContract(mapped);
        break;
      case "dev_live_page_beyond":
        this.validatePageBeyondLive(mapped, page);
        break;
      case "dev_live_primary":
      case "dev_live_min_y":
      case "dev_live_min_b":
      case "dev_live_max_r":
      case "dev_live_max_y":
      case "dev_live_max_b":
      case "dev_ignore_unknown_query":
        this.validateLiveOk(mapped, page, limit);
        break;
      case "dev_limit_one":
        this.validateLiveOk(mapped, page, limit);
        expect(mapped.rows.length).toBeLessThanOrEqual(1);
        break;
      default:
        break;
    }
  }
}
