import { expect } from "@playwright/test";
import {
  consumerReportDefaultLimit,
  consumerReportDefaultMeterSerial,
  consumerReportDefaultPage,
  consumerReportExpectedColumns,
} from "../Data/consumerreport.data";
import type {
  ConsumerReportErrorBody,
  ConsumerReportResponse,
  ConsumerReportRow,
  ConsumerReportScenario,
  ConsumerReportType,
  MappedConsumerReport,
} from "../Mapper/consumerreport.mapper";

const LS_DATE_TIME = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;
const FULL_DATE_TIME = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
const DECIMAL_OR_NULL = /^-?\d+(\.\d+)?$/;

function isNullableDecimal(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  return DECIMAL_OR_NULL.test(String(value).trim());
}

function reportTypeForScenario(
  scenario: ConsumerReportScenario,
): ConsumerReportType {
  if (
    scenario === "dev_live_dp" ||
    scenario === "contract_live_dp"
  ) {
    return "dp";
  }
  if (scenario === "dev_live_ip" || scenario === "contract_live_ip") {
    return "ip";
  }
  return "ls";
}

export class ConsumerReportValidator {
  validateResponseEnvelope(response: ConsumerReportResponse): void {
    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
  }

  validateValidationError(responseBody: ConsumerReportErrorBody): void {
    expect(responseBody.success).toBeFalsy();
    expect(responseBody.error).toBeDefined();
    expect(responseBody.error?.code).toBe("VALIDATION_ERROR");
    expect(responseBody.error?.message).toBeTruthy();
  }

  validateSuccess(mapped: MappedConsumerReport): void {
    expect(mapped.success).toBeTruthy();
  }

  validateRootStructure(mapped: MappedConsumerReport): void {
    expect(Array.isArray(mapped.columns)).toBeTruthy();
    expect(Array.isArray(mapped.rows)).toBeTruthy();
    expect(mapped.pagination).toBeDefined();
    expect(typeof mapped.pagination.page).toBe("number");
    expect(typeof mapped.pagination.limit).toBe("number");
  }

  validateColumns(
    mapped: MappedConsumerReport,
    reportType: ConsumerReportType,
  ): void {
    const expected = consumerReportExpectedColumns(reportType);
    expect(mapped.columns.length).toBe(expected.length);
    const keys = mapped.columns.map((c) => c.key);
    for (const col of expected) {
      expect(keys).toContain(col.key);
      expect(mapped.columns.find((c) => c.key === col.key)?.header).toBe(
        col.header,
      );
    }
    expect(keys).not.toContain("phases");
  }

  validatePaginationEcho(
    mapped: MappedConsumerReport,
    page: number,
    limit: number,
  ): void {
    expect(mapped.pagination.page).toBe(page);
    expect(mapped.pagination.limit).toBe(limit);
  }

  validatePaginationBounds(mapped: MappedConsumerReport): void {
    expect(mapped.pagination.page).toBeGreaterThan(0);
    expect(mapped.pagination.limit).toBeGreaterThan(0);
    expect(mapped.rows.length).toBeLessThanOrEqual(mapped.pagination.limit);
  }

  validatePaginationMath(
    mapped: MappedConsumerReport,
    includeTotal = true,
  ): void {
    const { total, limit, totalPages, totalIsExact, hasMore, page } =
      mapped.pagination;
    const { rows } = mapped;
    if (!includeTotal) {
      if (total != null && totalPages != null) {
        if (total === 0) {
          expect(rows.length).toBe(0);
          expect(totalPages).toBe(0);
        } else {
          expect(totalPages).toBe(Math.ceil(total / limit));
        }
      } else {
        expect(total).toBeNull();
        expect(totalPages).toBeNull();
        expect(rows.length).toBeGreaterThanOrEqual(0);
      }
      if (hasMore != null) expect(typeof hasMore).toBe("boolean");
      return;
    }
    expect(total).not.toBeNull();
    expect(totalPages).not.toBeNull();
    const t = total as number;
    const tp = totalPages as number;
    if (t === 0) {
      expect(rows.length).toBe(0);
      expect(tp).toBe(0);
      if (hasMore != null) expect(hasMore).toBe(false);
      return;
    }
    expect(tp).toBe(Math.ceil(t / limit));
    expect(t).toBeGreaterThanOrEqual(rows.length);
    if (totalIsExact != null) expect(typeof totalIsExact).toBe("boolean");
    if (hasMore != null) expect(hasMore).toBe(page < tp);
  }

  validateRowsStructure(
    rows: ConsumerReportRow[],
    reportType: ConsumerReportType,
  ): void {
    for (const row of rows) {
      expect(typeof row.id).toBe("string");
      expect(typeof row.slNo).toBe("number");
      expect(typeof row.dateTime).toBe("string");
      expect(isNullableDecimal(row.kWh)).toBeTruthy();
      expect(isNullableDecimal(row.kVAh)).toBeTruthy();
      if (reportType === "ls") {
        expect(LS_DATE_TIME.test(row.dateTime.trim())).toBeTruthy();
        expect(isNullableDecimal(row.voltage)).toBeTruthy();
        expect(isNullableDecimal(row.current)).toBeTruthy();
        expect(row.phases == null || typeof row.phases === "object").toBeTruthy();
      } else {
        expect(FULL_DATE_TIME.test(row.dateTime.trim())).toBeTruthy();
        expect(typeof row.name).toBe("string");
        expect(typeof row.address).toBe("string");
        expect(typeof row.ivrsNumber).toBe("string");
        expect(typeof row.msn).toBe("string");
        expect(typeof row.mf).toBe("string");
      }
      if (reportType === "ip") {
        expect(isNullableDecimal(row.voltage)).toBeTruthy();
        expect(isNullableDecimal(row.cur)).toBeTruthy();
        expect(isNullableDecimal(row.pf)).toBeTruthy();
        expect(isNullableDecimal(row.kW)).toBeTruthy();
        expect(isNullableDecimal(row.kva)).toBeTruthy();
        expect(isNullableDecimal(row.freq)).toBeTruthy();
        expect(isNullableDecimal(row.neutralCurrent)).toBeTruthy();
        expect(row.sourceId == null || typeof row.sourceId === "string").toBeTruthy();
      }
    }
  }

  validateRowIds(
    rows: ConsumerReportRow[],
    reportType: ConsumerReportType,
  ): void {
    for (const row of rows) {
      expect(row.id.startsWith(`row-${row.slNo}`)).toBeTruthy();
      if (reportType !== "ls" && row.msn) {
        expect(row.id).toContain(row.msn);
      }
    }
  }

  validateSameMeter(
    rows: ConsumerReportRow[],
    reportType: ConsumerReportType,
    meterSerial = consumerReportDefaultMeterSerial,
  ): void {
    if (reportType === "ls") return;
    for (const row of rows) {
      expect(row.msn).toBe(meterSerial);
    }
  }

  /**
   * Same meter on many rows is valid (DP/IP).
   * Same dateTime twice on one page is a duplicate fail.
   */
  validateNoDuplicateDateTimes(rows: ConsumerReportRow[]): void {
    const stamps = rows.map((row) => row.dateTime);
    expect(new Set(stamps).size).toBe(stamps.length);
  }

  validateUniqueSlNo(rows: ConsumerReportRow[]): void {
    const slNos = rows.map((row) => row.slNo);
    expect(new Set(slNos).size).toBe(slNos.length);
  }

  validateUniqueRowIds(rows: ConsumerReportRow[]): void {
    const ids = rows.map((row) => row.id);
    expect(new Set(ids).size).toBe(ids.length);
  }

  validateSlNoSequence(
    rows: ConsumerReportRow[],
    page: number,
    limit: number,
  ): void {
    const base = (page - 1) * limit;
    rows.forEach((row, index) => {
      expect(row.slNo).toBe(base + index + 1);
    });
  }

  validateLiveOk(
    mapped: MappedConsumerReport,
    reportType: ConsumerReportType,
    page = consumerReportDefaultPage,
    limit = consumerReportDefaultLimit,
    includeTotal = true,
    meterSerial = consumerReportDefaultMeterSerial,
  ): void {
    this.validateSuccess(mapped);
    this.validateRootStructure(mapped);
    this.validateColumns(mapped, reportType);
    this.validatePaginationEcho(mapped, page, limit);
    this.validatePaginationBounds(mapped);
    this.validatePaginationMath(mapped, includeTotal);
    if (mapped.rows.length > 0) {
      this.validateRowsStructure(mapped.rows, reportType);
      this.validateRowIds(mapped.rows, reportType);
      this.validateSameMeter(mapped.rows, reportType, meterSerial);
      this.validateSlNoSequence(mapped.rows, page, limit);
      this.validateUniqueSlNo(mapped.rows);
      this.validateUniqueRowIds(mapped.rows);
      this.validateNoDuplicateDateTimes(mapped.rows);
    }
  }

  validateLiveLsContract(mapped: MappedConsumerReport): void {
    this.validateLiveOk(mapped, "ls", 1, 10, true);
    expect(mapped.rows.length).toBe(2);
    expect(mapped.rows[0]?.dateTime).toBe("2025-10-01 00:00");
    expect(mapped.rows[0]?.voltage).toBe("250.100");
    expect(mapped.pagination.hasMore).toBe(true);
  }

  validateLiveDpContract(mapped: MappedConsumerReport): void {
    this.validateLiveOk(mapped, "dp", 1, 10, true);
    expect(mapped.rows.length).toBe(2);
    expect(mapped.rows[0]?.msn).toBe("14080783");
    expect(mapped.rows[0]?.kWh).toBe("1773.00");
    expect(mapped.rows[1]?.msn).toBe(mapped.rows[0]?.msn);
    expect(mapped.rows[1]?.dateTime).not.toBe(mapped.rows[0]?.dateTime);
  }

  validateLiveIpContract(mapped: MappedConsumerReport): void {
    this.validateLiveOk(mapped, "ip", 1, 10, true);
    expect(mapped.rows.length).toBe(2);
    expect(mapped.rows[0]?.msn).toBe("14080783");
    expect(mapped.rows[0]?.pf).toBe("-0.470");
    expect(mapped.rows[1]?.dateTime).not.toBe(mapped.rows[0]?.dateTime);
  }

  validateEmptyPageContract(mapped: MappedConsumerReport): void {
    this.validateLiveOk(mapped, "ls", 1, 10, true);
    expect(mapped.pagination.total).toBe(0);
    expect(mapped.rows.length).toBe(0);
  }

  validatePageBeyondLive(mapped: MappedConsumerReport): void {
    this.validateSuccess(mapped);
    this.validateRootStructure(mapped);
    this.validateColumns(mapped, "ls");
    this.validatePaginationBounds(mapped);
    this.validatePaginationMath(mapped, true);
    if (mapped.pagination.hasMore === false) {
      expect(mapped.rows.length).toBe(0);
    }
  }

  validateScenario(
    mapped: MappedConsumerReport,
    scenario: ConsumerReportScenario,
    page = consumerReportDefaultPage,
    limit = consumerReportDefaultLimit,
  ): void {
    const reportType = reportTypeForScenario(scenario);
    switch (scenario) {
      case "contract_live_ls":
        this.validateLiveLsContract(mapped);
        break;
      case "contract_live_dp":
        this.validateLiveDpContract(mapped);
        break;
      case "contract_live_ip":
        this.validateLiveIpContract(mapped);
        break;
      case "contract_empty_page":
        this.validateEmptyPageContract(mapped);
        break;
      case "dev_live_page_beyond":
        this.validatePageBeyondLive(mapped);
        break;
      case "dev_live_ls_without_total":
        this.validateLiveOk(mapped, "ls", page, limit, false);
        break;
      case "dev_live_ls":
      case "dev_live_dp":
      case "dev_live_ip":
      case "dev_ignore_unknown_query":
      case "dev_limit_one":
      case "invalid_report_type":
      case "missing_report_type":
        this.validateLiveOk(mapped, reportType, page, limit, true);
        break;
      default:
        break;
    }
  }
}
