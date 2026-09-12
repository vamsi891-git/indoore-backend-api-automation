import { expect } from "@playwright/test";
import {
  MdAnalysisResponse,
  MdAnalysisRow,
} from "../Mapper/mdanalysis.mapper";
import { mdGridColumnKeys, type MdAnalysisType } from "../Data/mdanalysis.data";
import {
  isCommercialGridData,
  validateCommercialPagination,
  validateCommercialQueryParams,
  validateCommercialTotalCount,
  validateNoDuplicateMeterRows,
  validateUniqueMeterIdentityAllowingDistinctMetric,
  formatCommercialMetricKey,
} from "./commercial-analysis.shared";

export interface MdAnalysisQueryShape {
  month: number;
  year: number;
  type: MdAnalysisType;
  months?: number;
  page: number;
  pageSize: number;
  connectionCategory?: "domestic" | "non-domestic";
}

function isCdCompareType(type: MdAnalysisType): boolean {
  return type === "MD > CD Last Three Month";
}

function isSanctionLoadType(type: MdAnalysisType): boolean {
  return type === "Sanction Load Violation";
}

function isImproperType(type: MdAnalysisType): boolean {
  return type === "Improper MD";
}

function requiresMdExceedsSanctionedLoad(type: MdAnalysisType): boolean {
  return isCdCompareType(type) || isSanctionLoadType(type);
}

export class MdAnalysisValidator {
  validateResponse(response: MdAnalysisResponse): void {
    expect(response.success).toBeTruthy();
    expect(response.data).toBeDefined();
    expect(response.data.rows.length).toBeGreaterThan(0);
    if (!isCommercialGridData(response.data)) {
      expect(response.data.reportName).toBeTruthy();
      expect(response.data.description).toBeTruthy();
    }
  }

  validateGridColumns(
    response: MdAnalysisResponse,
    type: MdAnalysisType,
  ): void {
    const columns = response.data.columns;
    if (!columns?.length) {
      return;
    }
    const keys = columns.map((column) => column.key);
    for (const expected of mdGridColumnKeys(type)) {
      expect(keys, `missing MD column ${expected}`).toContain(expected);
    }
  }

  validateQueryParams(
    response: MdAnalysisResponse,
    query: MdAnalysisQueryShape,
  ): void {
    validateCommercialQueryParams(response.data, query);
  }

  validateReportForType(
    response: MdAnalysisResponse,
    type: MdAnalysisType,
  ): void {
    if (isCommercialGridData(response.data)) {
      return;
    }
    if (isCdCompareType(type)) {
      expect(response.data.reportName).toMatch(/MD\s*>\s*CD/i);
      expect(response.data.description).toMatch(/MD\s*>\s*CD/i);
    } else if (isSanctionLoadType(type)) {
      expect(response.data.reportName).toMatch(/sanction/i);
    } else if (isImproperType(type)) {
      expect(response.data.reportName).toMatch(/improper/i);
    }
  }

  validateMandatoryFields(
    rows: MdAnalysisRow[],
    type: MdAnalysisType,
  ): void {
    for (const row of rows) {
      expect(row.meterLookupId).toBeGreaterThan(0);
      expect(row.msn).toBeTruthy();
      expect(row.ivrsNumber).toBeTruthy();
      if (isImproperType(type)) {
        expect(row.mdDate, `MSN ${row.msn}: Improper MD requires mdDate`).toBeTruthy();
        continue;
      }
      expect(Number.isFinite(row.sanctionedLoad)).toBeTruthy();
      expect(Number.isFinite(row.md)).toBeTruthy();
      expect(row.sanctionedLoad).toBeGreaterThanOrEqual(0);
    }
  }

  /** Backend billing filter: md_kw IS NOT NULL AND md_kw > 0. */
  validateMdPositive(rows: MdAnalysisRow[]): void {
    for (const row of rows) {
      expect(row.md, `MSN ${row.msn}: MD must be > 0`).toBeGreaterThan(0);
    }
  }

  /**
   * MD > CD / Sanction Load: sanctionedLoad > 0 AND md > sanctionedLoad.
   * Live grid is not ordered by md DESC.
   */
  validateMdExceedsSanctionedLoad(rows: MdAnalysisRow[]): void {
    for (const row of rows) {
      expect(
        row.sanctionedLoad,
        `MSN ${row.msn}: sanctionedLoad must be > 0`,
      ).toBeGreaterThan(0);
      expect(
        row.md,
        `MSN ${row.msn}: MD ${row.md} must exceed sanctionedLoad ${row.sanctionedLoad}`,
      ).toBeGreaterThan(row.sanctionedLoad);
    }
  }

  validateBusinessRules(rows: MdAnalysisRow[], type: MdAnalysisType): void {
    if (isImproperType(type)) {
      for (const row of rows) {
        expect(row.mdDate, `MSN ${row.msn}: Improper MD requires mdDate`).toBeTruthy();
      }
      return;
    }
    this.validateMdPositive(rows);
    if (requiresMdExceedsSanctionedLoad(type)) {
      this.validateMdExceedsSanctionedLoad(rows);
    }
  }

  validateNoDuplicateMdRecords(rows: MdAnalysisRow[]): void {
    validateNoDuplicateMeterRows(rows, "MD Analysis");
  }

  mdMetricKey(row: MdAnalysisRow): string {
    if (row.mdDate) {
      return `date=${row.mdDate}`;
    }
    return `${formatCommercialMetricKey(row.md)}|sl=${formatCommercialMetricKey(row.sanctionedLoad)}`;
  }

  /**
   * This report has no duplicate records. Still checks lookupId + DTR uniqueness
   * and same-MSN same-MD same-DTR on the page.
   */
  validateUniqueIdentityFields(rows: MdAnalysisRow[]): void {
    validateUniqueMeterIdentityAllowingDistinctMetric(
      rows,
      "MD Analysis",
      (row) => this.mdMetricKey(row),
    );
  }

  /** Unique meterLookupId + row id on the page. This report has no duplicate records. */
  validateDuplicateContract(rows: MdAnalysisRow[]): void {
    this.validateNoDuplicateMdRecords(rows);
  }

  validatePagination(
    response: MdAnalysisResponse,
    query: MdAnalysisQueryShape,
  ): void {
    validateCommercialPagination(response.data, query);
  }

  validateTotalCount(
    response: MdAnalysisResponse,
    query: MdAnalysisQueryShape,
  ): void {
    validateCommercialTotalCount(response.data, query);
  }

  /**
   * MD > CD and Sanction Load honor connectionCategory:
   * domestic.total + non-domestic.total === unfiltered.total.
   */
  validateDomesticNonDomesticTotals(options: {
    allTotal: number;
    domesticTotal: number;
    nonDomesticTotal: number;
  }): void {
    const { allTotal, domesticTotal, nonDomesticTotal } = options;
    expect(domesticTotal, "domestic MD total").toBeGreaterThan(0);
    expect(nonDomesticTotal, "non-domestic MD total").toBeGreaterThan(0);
    expect(
      domesticTotal + nonDomesticTotal,
      "domestic + non-domestic must equal unfiltered total",
    ).toBe(allTotal);
  }
}
