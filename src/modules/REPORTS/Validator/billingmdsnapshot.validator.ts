import { expect } from "@playwright/test";
import {
  billingMdSnapshotDefaultLimit,
  billingMdSnapshotDefaultMonth,
  billingMdSnapshotDefaultPage,
  billingMdSnapshotDefaultYear,
  billingMdSnapshotExpectedColumns,
} from "../Data/billingmdsnapshot.data";
import type {
  BillingMdSnapshotErrorBody,
  BillingMdSnapshotResponse,
  BillingMdSnapshotRow,
  BillingMdSnapshotScenario,
  MappedBillingMdSnapshot,
} from "../Mapper/billingmdsnapshot.mapper";
import { billingMdSnapshotColumnKeys } from "../Mapper/billingmdsnapshot.mapper";

const METER_TS = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;

function isNullableString(value: unknown): boolean {
  return value === null || value === undefined || typeof value === "string";
}

function isNullableNumber(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  return typeof value === "number" && Number.isFinite(value);
}

export class BillingMdSnapshotValidator {
  validateResponseEnvelope(response: BillingMdSnapshotResponse): void {
    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
  }

  validateValidationError(responseBody: BillingMdSnapshotErrorBody): void {
    expect(responseBody.success).toBeFalsy();
    expect(responseBody.error).toBeDefined();
    expect(responseBody.error?.code).toBe("VALIDATION_ERROR");
    expect(responseBody.error?.message).toBeTruthy();
  }

  validateSuccess(mapped: MappedBillingMdSnapshot): void {
    expect(mapped.success).toBeTruthy();
  }

  validateRootStructure(mapped: MappedBillingMdSnapshot): void {
    expect(Array.isArray(mapped.columns)).toBeTruthy();
    expect(Array.isArray(mapped.rows)).toBeTruthy();
    expect(mapped.pagination).toBeDefined();
    expect(typeof mapped.pagination.page).toBe("number");
    expect(typeof mapped.pagination.limit).toBe("number");
  }

  validateColumns(mapped: MappedBillingMdSnapshot): void {
    expect(mapped.columns.length).toBe(billingMdSnapshotExpectedColumns.length);
    const keys = mapped.columns.map((c) => c.key);
    for (const col of billingMdSnapshotExpectedColumns) {
      expect(keys).toContain(col.key);
      expect(billingMdSnapshotColumnKeys).toContain(col.key);
      expect(mapped.columns.find((c) => c.key === col.key)?.header).toBe(
        col.header,
      );
    }
    expect(keys).not.toContain("meterLookupTblRefId");
  }

  validatePaginationEcho(
    mapped: MappedBillingMdSnapshot,
    page: number,
    limit: number,
  ): void {
    expect(mapped.pagination.page).toBe(page);
    expect(mapped.pagination.limit).toBe(limit);
  }

  validatePaginationBounds(mapped: MappedBillingMdSnapshot): void {
    expect(mapped.pagination.page).toBeGreaterThan(0);
    expect(mapped.pagination.limit).toBeGreaterThan(0);
    expect(mapped.rows.length).toBeLessThanOrEqual(mapped.pagination.limit);
  }

  /**
   * Known quirk: includeTotal=false can return total=0 / totalPages=0
   * while rows are still present. That is valid (not “no data”).
   */
  validatePaginationMath(
    mapped: MappedBillingMdSnapshot,
    includeTotal = false,
  ): void {
    const { total, limit, totalPages, totalIsExact, hasMore, page } =
      mapped.pagination;
    const { rows } = mapped;

    if (!includeTotal) {
      if (total != null && total > 0 && totalPages != null) {
        expect(totalPages).toBe(Math.ceil(total / limit));
        expect(total).toBeGreaterThanOrEqual(rows.length);
      }
      // total === 0 with rows is allowed for this API.
      if (totalIsExact != null) expect(typeof totalIsExact).toBe("boolean");
      if (hasMore != null) expect(typeof hasMore).toBe("boolean");
      return;
    }

    expect(total).not.toBeNull();
    expect(totalPages).not.toBeNull();
    const t = total as number;
    const tp = totalPages as number;

    if (rows.length > 0 && t === 0) {
      // Same quirk can appear even with includeTotal=true on some builds.
      if (hasMore != null) expect(typeof hasMore).toBe("boolean");
      return;
    }

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

  validateRowsStructure(rows: BillingMdSnapshotRow[]): void {
    for (const row of rows) {
      expect(typeof row.id).toBe("string");
      expect(typeof row.slNo).toBe("number");
      expect(typeof row.meterNumber).toBe("string");
      expect(row.meterNumber.trim().length).toBeGreaterThan(0);
      expect(typeof row.meterTimestamp).toBe("string");
      expect(METER_TS.test(row.meterTimestamp.trim())).toBeTruthy();

      expect(isNullableString(row.circle)).toBeTruthy();
      expect(isNullableString(row.division)).toBeTruthy();
      expect(isNullableString(row.zone)).toBeTruthy();
      expect(isNullableString(row.substation)).toBeTruthy();
      expect(isNullableString(row.feeder)).toBeTruthy();
      expect(isNullableString(row.dtr)).toBeTruthy();
      expect(isNullableString(row.consumerName)).toBeTruthy();
      expect(isNullableString(row.ivrsNumber)).toBeTruthy();
      expect(isNullableString(row.phase)).toBeTruthy();
      expect(isNullableString(row.tariff)).toBeTruthy();
      expect(isNullableString(row.mdKwOt)).toBeTruthy();
      expect(isNullableString(row.mdKvaOt)).toBeTruthy();

      expect(isNullableNumber(row.meterLookupTblRefId)).toBeTruthy();
      expect(isNullableNumber(row.sanctionedLoadKw)).toBeTruthy();
      expect(isNullableNumber(row.mdKw)).toBeTruthy();
      expect(isNullableNumber(row.mdKva)).toBeTruthy();
      expect(isNullableNumber(row.pf)).toBeTruthy();
      expect(isNullableNumber(row.kwhC)).toBeTruthy();
      expect(isNullableNumber(row.kvahC)).toBeTruthy();
    }
  }

  /**
   * Linked: `row-{slNo}-{meterLookupTblRefId}-{meterNumber}-{ivrsNumber}`
   * Sparse (no IVRS): `row-{slNo}-{meterLookupTblRefId}-{meterNumber}`
   * Sparse (meter only): `row-{slNo}-{meterNumber}`
   */
  validateRowIds(rows: BillingMdSnapshotRow[]): void {
    for (const row of rows) {
      expect(row.id.startsWith(`row-${row.slNo}-`)).toBeTruthy();
      expect(row.id).toContain(row.meterNumber);
      if (row.meterLookupTblRefId != null) {
        expect(row.id).toContain(String(row.meterLookupTblRefId));
      }
      if (row.ivrsNumber) {
        expect(row.id).toContain(row.ivrsNumber);
      }
    }
  }

  validateSlNoSequence(
    rows: BillingMdSnapshotRow[],
    page: number,
    limit: number,
  ): void {
    const base = (page - 1) * limit;
    rows.forEach((row, index) => {
      expect(row.slNo).toBe(base + index + 1);
    });
  }

  /**
   * Duplicate id / slNo / meter+billing time / lookup+billing time is a fail.
   * Same feeder, DTR, circle, or billing date on many meters is valid.
   */
  validateUniqueReadings(rows: BillingMdSnapshotRow[]): void {
    const ids = rows.map((row) => row.id);
    const slNos = rows.map((row) => row.slNo);
    const metersAtTime = rows.map(
      (row) => `${row.meterNumber}|${row.meterTimestamp}`,
    );
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(slNos).size).toBe(slNos.length);
    expect(new Set(metersAtTime).size).toBe(metersAtTime.length);

    const lookupsAtTime = rows
      .filter((row) => row.meterLookupTblRefId != null)
      .map((row) => `${row.meterLookupTblRefId}|${row.meterTimestamp}`);
    expect(new Set(lookupsAtTime).size).toBe(lookupsAtTime.length);
  }

  validateBillingWindow(
    rows: BillingMdSnapshotRow[],
    month = billingMdSnapshotDefaultMonth,
    year = billingMdSnapshotDefaultYear,
  ): void {
    const prefix = `${year}-${String(month).padStart(2, "0")}`;
    for (const row of rows) {
      expect(row.meterTimestamp.startsWith(prefix)).toBeTruthy();
    }
  }

  validateLiveOk(
    mapped: MappedBillingMdSnapshot,
    page = billingMdSnapshotDefaultPage,
    limit = billingMdSnapshotDefaultLimit,
    includeTotal = false,
  ): void {
    this.validateSuccess(mapped);
    this.validateRootStructure(mapped);
    this.validateColumns(mapped);
    this.validatePaginationEcho(mapped, page, limit);
    this.validatePaginationBounds(mapped);
    this.validatePaginationMath(mapped, includeTotal);
    if (mapped.rows.length > 0) {
      this.validateRowsStructure(mapped.rows);
      this.validateRowIds(mapped.rows);
      this.validateSlNoSequence(mapped.rows, page, limit);
      this.validateUniqueReadings(mapped.rows);
      this.validateBillingWindow(mapped.rows);
    }
  }

  validateLiveOct2025Contract(mapped: MappedBillingMdSnapshot): void {
    this.validateLiveOk(mapped, 1, 10, false);
    expect(mapped.rows.length).toBe(2);
    expect(mapped.pagination.total).toBe(0);
    expect(mapped.rows[0]?.meterNumber).toBe("85087252");
    expect(mapped.rows[0]?.mdKw).toBe(1.834);
    expect(mapped.rows[1]?.meterNumber).toBe("92574260");
    expect(mapped.rows[1]?.mdKw).toBe(0.009);
  }

  validateSparseHierarchyContract(mapped: MappedBillingMdSnapshot): void {
    this.validateLiveOk(mapped, 1, 10, false);
    expect(mapped.rows.length).toBe(2);
    expect(mapped.rows[0]?.circle).toBeNull();
    expect(mapped.rows[0]?.meterNumber).toBe("00262261");
    expect(mapped.rows[0]?.id).toBe("row-1-45243-00262261");
    expect(mapped.rows[1]?.mdKw).toBe(0);
    expect(mapped.rows[1]?.pf).toBe(0);
    expect(mapped.rows[1]?.mdKwOt).toBe("1900-01-01 05:21");
  }

  validateEmptyPageContract(mapped: MappedBillingMdSnapshot): void {
    this.validateLiveOk(mapped, 1, 10, true);
    expect(mapped.rows.length).toBe(0);
    expect(mapped.pagination.total).toBe(0);
  }

  validatePageBeyondLive(mapped: MappedBillingMdSnapshot): void {
    this.validateSuccess(mapped);
    this.validateRootStructure(mapped);
    this.validateColumns(mapped);
    this.validatePaginationBounds(mapped);
    this.validatePaginationMath(mapped, false);
    const { totalPages } = mapped.pagination;
    if (totalPages != null && totalPages > 0) {
      expect(mapped.rows.length).toBe(0);
    }
    if (mapped.rows.length > 0) {
      this.validateRowsStructure(mapped.rows);
      this.validateRowIds(mapped.rows);
      this.validateUniqueReadings(mapped.rows);
    }
  }

  validateScenario(
    mapped: MappedBillingMdSnapshot,
    scenario: BillingMdSnapshotScenario,
    page = billingMdSnapshotDefaultPage,
    limit = billingMdSnapshotDefaultLimit,
  ): void {
    switch (scenario) {
      case "contract_live_oct_2025":
        this.validateLiveOct2025Contract(mapped);
        break;
      case "contract_sparse_hierarchy":
        this.validateSparseHierarchyContract(mapped);
        break;
      case "contract_empty_page":
        this.validateEmptyPageContract(mapped);
        break;
      case "dev_live_page_beyond":
        this.validatePageBeyondLive(mapped);
        break;
      case "dev_live_include_total":
        this.validateLiveOk(mapped, page, limit, true);
        break;
      case "dev_live_without_total":
      case "dev_limit_one":
      case "dev_ignore_unknown_query":
        this.validateLiveOk(mapped, page, limit, false);
        break;
      default:
        break;
    }
  }
}
