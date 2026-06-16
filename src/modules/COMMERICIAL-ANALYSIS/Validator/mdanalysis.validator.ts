import { expect } from "@playwright/test";
import {
  MdAnalysisResponse,
  MdAnalysisRow,
} from "../Mapper/mdanalysis.mapper";
import type { MdAnalysisType } from "../Data/mdanalysis.data";
import {
  isCommercialGridData,
  validateCommercialPagination,
  validateCommercialQueryParams,
  validateCommercialTotalCount,
  validateNoDuplicateMeterRows,
} from "./commercial-analysis.shared";

export interface MdAnalysisQueryShape {
  month: number;
  year: number;
  type: MdAnalysisType;
  months?: number;
  page: number;
  pageSize: number;
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

  validateMandatoryFields(rows: MdAnalysisRow[]): void {
    for (const row of rows) {
      expect(row.meterLookupId).toBeGreaterThan(0);
      expect(row.msn).toBeTruthy();
      expect(Number.isFinite(row.sanctionedLoad)).toBeTruthy();
      expect(Number.isFinite(row.md)).toBeTruthy();
      expect(row.sanctionedLoad).toBeGreaterThanOrEqual(0);
    }
  }

  /** Backend billing filter: md_kw IS NOT NULL AND md_kw > 0 */
  validateMdPositive(rows: MdAnalysisRow[]): void {
    for (const row of rows) {
      expect(
        row.md,
        `MSN ${row.msn}: MD must be > 0`,
      ).toBeGreaterThan(0);
    }
  }

  /**
   * Backend fetchMdAnalysis for cd_compare / sanction_load:
   * Sanctioned_Load_KW > 0 AND max_md > Sanctioned_Load_KW
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
    this.validateMdPositive(rows);

    if (requiresMdExceedsSanctionedLoad(type)) {
      this.validateMdExceedsSanctionedLoad(rows);
    }
  }

  /** Backend ORDER BY md_rows.max_md DESC */
  validateMdDescendingOrder(rows: MdAnalysisRow[]): void {
    for (let i = 1; i < rows.length; i++) {
      expect(
        rows[i - 1].md,
        `MD not descending at index ${i - 1} (MSN ${rows[i - 1].msn} vs ${rows[i].msn})`,
      ).toBeGreaterThanOrEqual(rows[i].md);
    }
  }

  validateNoDuplicateMdRecords(rows: MdAnalysisRow[]): void {
    validateNoDuplicateMeterRows(rows, "MD Analysis");
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
}
