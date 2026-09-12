import { expect } from "@playwright/test";
import {
  currentWithoutVoltageDefaultLimit,
  currentWithoutVoltageDefaultPage,
  currentWithoutVoltageExpectedColumns,
  currentWithoutVoltagePhaseHeaders,
} from "../Data/currentwithoutvoltage.data";
import type {
  CurrentWithoutVoltageErrorBody,
  CurrentWithoutVoltageResponse,
  CurrentWithoutVoltageRow,
  CurrentWithoutVoltageScenario,
  MappedCurrentWithoutVoltage,
} from "../Mapper/currentwithoutvoltage.mapper";
import { currentWithoutVoltageColumnKeys } from "../Mapper/currentwithoutvoltage.mapper";

const DECIMAL = /^-?\d+(\.\d+)?$/;
const METER_READING_DT = /^\d{2}-\d{2}-\d{4} \d{2}:\d{2}$/;
const PHASE_LETTER = /^[RYB]$/;

export class CurrentWithoutVoltageValidator {
  validateResponseEnvelope(response: CurrentWithoutVoltageResponse): void {
    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
  }

  validateValidationError(responseBody: CurrentWithoutVoltageErrorBody): void {
    expect(responseBody.success).toBeFalsy();
    expect(responseBody.error).toBeDefined();
    expect(responseBody.error?.code).toBe("VALIDATION_ERROR");
    expect(responseBody.error?.message).toBeTruthy();
  }

  validateSuccess(mapped: MappedCurrentWithoutVoltage): void {
    expect(mapped.success).toBeTruthy();
  }

  validateRootStructure(mapped: MappedCurrentWithoutVoltage): void {
    expect(Array.isArray(mapped.columns)).toBeTruthy();
    expect(Array.isArray(mapped.rows)).toBeTruthy();
    expect(mapped.pagination).toBeDefined();
    expect(typeof mapped.pagination.page).toBe("number");
    expect(typeof mapped.pagination.limit).toBe("number");
    expect(
      mapped.pagination.total === null ||
        typeof mapped.pagination.total === "number",
    ).toBeTruthy();
    expect(
      mapped.pagination.totalPages === null ||
        typeof mapped.pagination.totalPages === "number",
    ).toBeTruthy();
  }

  /**
   * Keys stay `rCurrent` / `rnVoltage`; headers follow query phase
   * (`R Current` / `RN Voltage`, `Y Current` / `YN Voltage`, `B Current` / `BN Voltage`).
   */
  validateColumns(
    mapped: MappedCurrentWithoutVoltage,
    phase: "R" | "Y" | "B" = "R",
  ): void {
    const expected = currentWithoutVoltageExpectedColumns(phase);
    expect(mapped.columns.length).toBe(expected.length);
    const keys = mapped.columns.map((column) => column.key);
    for (const col of expected) {
      expect(keys).toContain(col.key);
      expect(currentWithoutVoltageColumnKeys).toContain(col.key);
      const actual = mapped.columns.find((c) => c.key === col.key);
      expect(actual?.header).toBe(col.header);
    }
    const phaseHeaders = currentWithoutVoltagePhaseHeaders(phase);
    expect(
      mapped.columns.find((c) => c.key === "rCurrent")?.header,
    ).toBe(phaseHeaders.current.header);
    expect(
      mapped.columns.find((c) => c.key === "rnVoltage")?.header,
    ).toBe(phaseHeaders.voltage.header);
  }

  validatePaginationEcho(
    mapped: MappedCurrentWithoutVoltage,
    page: number,
    limit: number,
  ): void {
    expect(mapped.pagination.page).toBe(page);
    expect(mapped.pagination.limit).toBe(limit);
  }

  validatePaginationBounds(mapped: MappedCurrentWithoutVoltage): void {
    expect(mapped.pagination.page).toBeGreaterThan(0);
    expect(mapped.pagination.limit).toBeGreaterThan(0);
    if (mapped.pagination.total != null) {
      expect(mapped.pagination.total).toBeGreaterThanOrEqual(0);
    }
    if (mapped.pagination.totalPages != null) {
      expect(mapped.pagination.totalPages).toBeGreaterThanOrEqual(0);
    }
    expect(mapped.rows.length).toBeLessThanOrEqual(mapped.pagination.limit);
  }

  validatePaginationMath(mapped: MappedCurrentWithoutVoltage): void {
    const { total, limit, totalPages, totalIsExact, hasMore, page, nextCursor } =
      mapped.pagination;
    const { rows } = mapped;
    if (totalIsExact != null) expect(typeof totalIsExact).toBe("boolean");
    if (hasMore != null) expect(typeof hasMore).toBe("boolean");
    if (nextCursor !== undefined) {
      expect(nextCursor === null || typeof nextCursor === "string").toBeTruthy();
    }

    if (total == null) {
      if (hasMore === true) {
        expect(typeof nextCursor).toBe("string");
        expect(String(nextCursor).trim().length).toBeGreaterThan(0);
      }
      return;
    }

    if (total === 0) {
      expect(rows.length).toBe(0);
      expect(totalPages === 0 || totalPages == null).toBeTruthy();
      if (hasMore != null) expect(hasMore).toBe(false);
      return;
    }

    if (totalPages != null) {
      expect(totalPages).toBe(Math.ceil(total / limit));
      if (hasMore != null) expect(hasMore).toBe(page < totalPages);
    }
    expect(total).toBeGreaterThanOrEqual(rows.length);
  }

  validateRowsLimit(mapped: MappedCurrentWithoutVoltage): void {
    expect(mapped.rows.length).toBeLessThanOrEqual(mapped.pagination.limit);
  }

  validateNoDataScenario(mapped: MappedCurrentWithoutVoltage): void {
    if (mapped.pagination.total === 0) {
      expect(mapped.rows.length).toBe(0);
    }
  }

  validatePageBeyondTotal(
    mapped: MappedCurrentWithoutVoltage,
    requestedPage: number,
  ): void {
    if (
      mapped.pagination.totalPages != null &&
      mapped.pagination.totalPages > 0 &&
      requestedPage > mapped.pagination.totalPages
    ) {
      expect(mapped.rows.length).toBe(0);
    }
  }

  validateRowsStructure(rows: CurrentWithoutVoltageRow[]): void {
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
      expect(typeof row.rCurrent).toBe("string");
      expect(typeof row.rnVoltage).toBe("string");
      expect(typeof row.nightKwh).toBe("string");
      expect(typeof row.dayKwh).toBe("string");
      expect(typeof row.meterReadingDateTime).toBe("string");
    }
  }

  /** Live ids: `row-{slNo}-{meterSerialNumber}`. */
  validateRowIds(rows: CurrentWithoutVoltageRow[]): void {
    for (const row of rows) {
      expect(row.id).toBe(`row-${row.slNo}-${row.meterSerialNumber}`);
    }
  }

  validateReadingFields(rows: CurrentWithoutVoltageRow[]): void {
    for (const row of rows) {
      expect(row.meterSerialNumber.trim().length).toBeGreaterThan(0);
      expect(row.phase.trim().length).toBeGreaterThan(0);
      expect(DECIMAL.test(row.rCurrent.trim())).toBeTruthy();
      expect(DECIMAL.test(row.rnVoltage.trim())).toBeTruthy();
      expect(DECIMAL.test(row.nightKwh.trim())).toBeTruthy();
      expect(DECIMAL.test(row.dayKwh.trim())).toBeTruthy();
      expect(METER_READING_DT.test(row.meterReadingDateTime.trim())).toBeTruthy();
    }
  }

  validateOptionalLabels(rows: CurrentWithoutVoltageRow[]): void {
    for (const row of rows) {
      expect(typeof row.circle).toBe("string");
      expect(typeof row.division).toBe("string");
      expect(typeof row.zone).toBe("string");
      expect(typeof row.name).toBe("string");
    }
  }

  validateSlNoSequence(
    rows: CurrentWithoutVoltageRow[],
    page: number,
    limit: number,
  ): void {
    const base = (page - 1) * limit;
    rows.forEach((row, index) => {
      expect(row.slNo).toBe(base + index + 1);
    });
  }

  /**
   * Same meter on different reading times is valid (interval snapshots).
   * Same DTR / feeder / phase label / datetime across meters is valid.
   * Duplicate id, slNo, or meter+datetime on one page is a fail.
   */
  validateUniqueReadings(rows: CurrentWithoutVoltageRow[]): void {
    const ids = rows.map((row) => row.id);
    const slNos = rows.map((row) => row.slNo);
    const msnTimes = rows.map(
      (row) => `${row.meterSerialNumber}_${row.meterReadingDateTime}`,
    );
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(slNos).size).toBe(slNos.length);
    expect(new Set(msnTimes).size).toBe(msnTimes.length);
  }

  validateLiveOk(
    mapped: MappedCurrentWithoutVoltage,
    page = currentWithoutVoltageDefaultPage,
    limit = currentWithoutVoltageDefaultLimit,
    phase: "R" | "Y" | "B" = "R",
  ): void {
    expect(PHASE_LETTER.test(phase)).toBeTruthy();
    this.validateSuccess(mapped);
    this.validateRootStructure(mapped);
    this.validateColumns(mapped, phase);
    this.validatePaginationEcho(mapped, page, limit);
    this.validatePaginationBounds(mapped);
    this.validatePaginationMath(mapped);
    this.validateRowsLimit(mapped);
    this.validateNoDataScenario(mapped);
    if (mapped.rows.length > 0) {
      this.validateRowsStructure(mapped.rows);
      this.validateRowIds(mapped.rows);
      this.validateReadingFields(mapped.rows);
      this.validateOptionalLabels(mapped.rows);
      this.validateSlNoSequence(mapped.rows, page, limit);
      this.validateUniqueReadings(mapped.rows);
    }
  }

  validateLiveFullContract(mapped: MappedCurrentWithoutVoltage): void {
    this.validateLiveOk(mapped, 1, 10, "R");
    expect(mapped.pagination.total).toBeNull();
    expect(mapped.pagination.totalPages).toBeNull();
    expect(mapped.pagination.totalIsExact).toBe(false);
    expect(mapped.pagination.hasMore).toBe(true);
    expect(mapped.rows.length).toBe(2);
    expect(mapped.rows[0]?.meterSerialNumber).toBe("262710");
    expect(mapped.rows[0]?.rCurrent).toBe("1.350");
    expect(mapped.rows[0]?.rnVoltage).toBe("0.000");
    expect(mapped.rows[1]?.meterSerialNumber).toBe("85130832");
    expect(mapped.rows[0]?.meterSerialNumber).not.toBe(
      mapped.rows[1]?.meterSerialNumber,
    );
    expect(mapped.rows[0]?.meterReadingDateTime).toBe(
      mapped.rows[1]?.meterReadingDateTime,
    );
    expect(mapped.columns.find((c) => c.key === "rCurrent")?.header).toBe(
      "R Current",
    );
  }

  validateEmptyPageContract(mapped: MappedCurrentWithoutVoltage): void {
    this.validateLiveOk(mapped, 1, 10, "R");
    expect(mapped.pagination.total).toBe(0);
    expect(mapped.rows.length).toBe(0);
  }

  validatePageBeyondLive(
    mapped: MappedCurrentWithoutVoltage,
    requestedPage: number,
    phase: "R" | "Y" | "B" = "R",
  ): void {
    this.validateSuccess(mapped);
    this.validateRootStructure(mapped);
    this.validateColumns(mapped, phase);
    this.validatePaginationBounds(mapped);
    this.validatePaginationMath(mapped);
    this.validatePageBeyondTotal(mapped, requestedPage);
    if (mapped.rows.length > 0) {
      this.validateUniqueReadings(mapped.rows);
    }
  }

  validateScenario(
    mapped: MappedCurrentWithoutVoltage,
    scenario: CurrentWithoutVoltageScenario,
    page = currentWithoutVoltageDefaultPage,
    limit = currentWithoutVoltageDefaultLimit,
  ): void {
    switch (scenario) {
      case "contract_live_full":
        this.validateLiveFullContract(mapped);
        break;
      case "contract_empty_page":
        this.validateEmptyPageContract(mapped);
        break;
      case "dev_live_page_beyond":
        this.validatePageBeyondLive(mapped, page, "R");
        break;
      case "dev_live_primary":
      case "dev_ignore_unknown_query":
      case "dev_missing_phase_defaults":
        this.validateLiveOk(mapped, page, limit, "R");
        break;
      case "dev_limit_one":
        this.validateLiveOk(mapped, page, limit, "R");
        expect(mapped.rows.length).toBeLessThanOrEqual(1);
        break;
      case "dev_live_phase_y":
        this.validateLiveOk(mapped, page, limit, "Y");
        break;
      case "dev_live_phase_b":
        this.validateLiveOk(mapped, page, limit, "B");
        break;
      default:
        break;
    }
  }
}
