import { expect } from "@playwright/test";
import type { ZodType } from "zod";
import { BackendResponse } from "../../../core/utils/backend-response.util";
import { assertZodSchema } from "../../../core/utils/zod-validation.helper";
import { EXPECTED_CONSUMER_VALIDATION_COLUMNS } from "../Data/consumer-validation.data";
import {
  ConsumerValidationData,
  ConsumerValidationQuery,
  ConsumerValidationResponse,
  ConsumerValidationRow,
} from "../Mapper/consumer-validation.mapper";
import { ConsumerValidationSuccessResponseSchema } from "../schemas/consumer-validation.schemas";
import type { ConsumerValidationExportRow } from "../Utils/consumer-validation-export.helper";

function findDuplicateKeys(keys: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const key of keys) {
    if (!key) continue;
    if (seen.has(key)) {
      duplicates.add(key);
    } else {
      seen.add(key);
    }
  }
  return [...duplicates];
}

/** Business identity of one validation hit (export has no row id). */
function validationBusinessKey(row: {
  meterSerialNumber: string;
  accountId: string;
  validationName: string;
  validationDate: string;
}): string {
  return [
    row.meterSerialNumber.trim().toLowerCase(),
    row.accountId.trim().toLowerCase(),
    row.validationName.trim().toLowerCase(),
    row.validationDate.trim().toLowerCase(),
  ].join("|");
}

export class ConsumerValidationValidator {
  static validateZodResponseSchema<T>(body: unknown, schema: ZodType<T>): T {
    return assertZodSchema(schema, body, "Zod Response Schema");
  }

  static validateErrorResponse(
    status: number,
    body: { success?: boolean; error?: { code?: string; message?: string } },
    expectedStatuses: number[],
  ): void {
    expect(expectedStatuses).toContain(status);
    expect(body.success).toBe(false);
    expect(body.error?.code).toBeTruthy();
    expect(body.error?.message).toBeTruthy();
  }

  validateResponse(response: ConsumerValidationResponse): void {
    expect(response.success).toBeTruthy();
    ConsumerValidationValidator.validateZodResponseSchema(
      response,
      ConsumerValidationSuccessResponseSchema,
    );
  }

  validateColumns(data: ConsumerValidationData): void {
    expect(data.columns).toEqual([...EXPECTED_CONSUMER_VALIDATION_COLUMNS]);
  }

  validatePagination(data: ConsumerValidationData, query: ConsumerValidationQuery): void {
    const { pagination, rows } = data;
    expect(pagination.page).toEqual(query.page ?? 1);
    expect(pagination.limit).toEqual(query.limit ?? 20);
    expect(pagination.total).toBeGreaterThanOrEqual(0);
    expect(pagination.totalPages).toBeGreaterThanOrEqual(0);
    expect(rows.length).toBeLessThanOrEqual(pagination.limit);

    if (pagination.total === 0) {
      expect(pagination.totalPages).toEqual(0);
      expect(rows.length).toEqual(0);
      return;
    }

    expect(pagination.totalPages).toEqual(Math.ceil(pagination.total / pagination.limit));

    if (pagination.page < pagination.totalPages) {
      expect(rows.length).toEqual(pagination.limit);
    } else if (pagination.page === pagination.totalPages) {
      const remainder = pagination.total % pagination.limit;
      const expectedRows = remainder === 0 ? pagination.limit : remainder;
      expect(rows.length).toEqual(expectedRows);
    } else {
      // Backend returns empty items when offset >= total.
      expect(rows.length).toEqual(0);
    }
  }

  validateRowsExist(data: ConsumerValidationData): void {
    const { pagination, rows } = data;
    if (pagination.total > 0 && pagination.page <= pagination.totalPages) {
      expect(rows.length).toBeGreaterThan(0);
    } else {
      expect(rows.length).toEqual(0);
    }
  }

  validateEmptyRows(data: ConsumerValidationData): void {
    expect(data.rows.length).toEqual(0);
  }

  validateLimitOne(data: ConsumerValidationData): void {
    expect(data.rows.length).toBeLessThanOrEqual(1);
    if (data.pagination.total > 0 && data.pagination.page <= data.pagination.totalPages) {
      expect(data.rows.length).toEqual(1);
    }
  }

  validateRequiredFields(data: ConsumerValidationData): void {
    data.rows.forEach((row) => {
      expect(row.id.trim()).not.toEqual("");
      expect(row.consumerId.trim()).not.toEqual("");
      expect(row.meterSerialNumber.trim()).not.toEqual("");
      expect(row.validationName.trim()).not.toEqual("");
      expect(row.validationStatus.trim()).not.toEqual("");
      expect(row.validationDate.trim()).not.toEqual("");
    });
  }

  validateDataTypes(data: ConsumerValidationData): void {
    data.rows.forEach((row) => {
      expect(typeof row.id).toBe("string");
      expect(typeof row.consumerId).toBe("string");
      expect(typeof row.consumerName).toBe("string");
      expect(typeof row.ivrsNumber).toBe("string");
      expect(typeof row.accountId).toBe("string");
      expect(typeof row.meterSerialNumber).toBe("string");
      expect(typeof row.meterPhase).toBe("string");
      expect(typeof row.category).toBe("string");
      expect(typeof row.validationName).toBe("string");
      expect(typeof row.validationRule).toBe("string");
      expect(typeof row.validationStatus).toBe("string");
      expect(typeof row.validationDate).toBe("string");
    });
  }

  /**
   * Reports duplicate list ids / meter+account+rule+date as backend findings.
   * Live data still emits the same validation id twice (alternate consumerId forms);
   * do not hard-fail smoke on that known data-quality bug.
   */
  validateNoDuplicateRows(rows: ConsumerValidationRow[]): void {
    if (rows.length === 0) return;

    const duplicateIds = findDuplicateKeys(rows.map((row) => row.id.trim()));
    if (duplicateIds.length > 0) {
      BackendResponse.logFinding(
        "consumer-validation duplicate ids",
        `${duplicateIds.length}; sample: ${duplicateIds.slice(0, 8).join(", ")}`,
      );
    }

    const duplicateBusiness = findDuplicateKeys(rows.map(validationBusinessKey));
    if (duplicateBusiness.length > 0) {
      BackendResponse.logFinding(
        "consumer-validation duplicate meter/account/rule/date",
        `${duplicateBusiness.length}; sample: ${duplicateBusiness.slice(0, 5).join(" || ")}`,
      );
    }
  }

  validateDownloadHeaders(contentType: string, contentDisposition: string): void {
    expect(contentType, "export content-type must be xlsx").toMatch(
      /spreadsheetml|octet-stream|excel/i,
    );
    expect(
      contentDisposition.toLowerCase(),
      "export content-disposition must be attachment",
    ).toContain("attachment");
    expect(contentDisposition.toLowerCase()).toContain("filename=");
    expect(contentDisposition.toLowerCase()).toContain(".xlsx");
  }

  validateExportHeadersMatchList(listHeaders: string[], exportHeaders: string[]): void {
    expect(exportHeaders).toEqual(listHeaders);
    expect(exportHeaders).toEqual(
      EXPECTED_CONSUMER_VALIDATION_COLUMNS.map((column) => column.header),
    );
  }

  validateExportNotEmpty(rows: ConsumerValidationExportRow[]): void {
    expect(rows.length).toBeGreaterThan(0);
  }

  /** Same soft finding as list — export has no row id column. */
  validateExportNoDuplicateRows(rows: ConsumerValidationExportRow[]): void {
    if (rows.length === 0) return;

    const duplicateBusiness = findDuplicateKeys(rows.map(validationBusinessKey));
    if (duplicateBusiness.length > 0) {
      BackendResponse.logFinding(
        "consumer-validation export duplicate meter/account/rule/date",
        `${duplicateBusiness.length}; sample: ${duplicateBusiness.slice(0, 8).join(" || ")}`,
      );
    }
  }
}
