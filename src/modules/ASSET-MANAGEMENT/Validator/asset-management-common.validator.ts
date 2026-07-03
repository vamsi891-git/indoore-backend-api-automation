import { expect } from "@playwright/test";
import type { ZodType } from "zod";
import { assertZodSchema } from "../../../core/utils/zod-validation.helper";
import type { DtrDetailData } from "../Mapper/dtrId.mapper";

export class AssetManagementCommonValidator {
  static validateZodResponseSchema<T>(body: unknown, schema: ZodType<T>): T {
    return assertZodSchema(schema, body, "Zod Response Schema");
  }

  static validateSuccessEnvelope(body: { success?: boolean }): void {
    expect(body.success).toBe(true);
  }
  static validateErrorResponse(
    status: number,
    body: { success?: boolean; error?: { code?: string; message?: string } },
    expectedStatuses: number[],
    expectedCode?: string,
  ): void {
    expect(expectedStatuses).toContain(status);
    expect(body.success).toBe(false);
    expect(body.error?.code).toBeTruthy();
    expect(body.error?.message).toBeTruthy();
    if (expectedCode) {
      expect(body.error?.code).toBe(expectedCode);
    }
  }
  /**
   * DTR detail pagination contract (backend):
   * - `total` / `totalPages` are derived from distinct meter count
   * - `consumers` are paginated by distinct consumer with LIMIT/OFFSET
   * Row counts on intermediate/last pages therefore must not be matched to meter remainder math.
   */
  static validatePaginationConsistency(
    data: Pick<DtrDetailData, "page" | "limit" | "total" | "totalPages" | "consumers">,
    requestedPage: number,
    requestedLimit: number,
  ): void {
    expect(data.page).toEqual(requestedPage);
    expect(data.limit).toEqual(requestedLimit);
    expect(data.page).toBeGreaterThan(0);
    expect(data.limit).toBeGreaterThan(0);
    expect(data.total).toBeGreaterThanOrEqual(0);
    expect(data.totalPages).toBeGreaterThanOrEqual(0);
    expect(data.consumers.length).toBeLessThanOrEqual(data.limit);

    if (data.total === 0) {
      expect(data.totalPages).toEqual(0);
      expect(data.consumers.length).toEqual(0);
      return;
    }

    expect(data.totalPages).toEqual(Math.ceil(data.total / data.limit));

    if (data.page > data.totalPages) {
      expect(data.consumers.length).toEqual(0);
    }
  }

  /** Last meter-based page may still return up to `limit` consumers when meter count ≠ consumer count. */
  static validateLastPageConsumers(
    data: Pick<DtrDetailData, "page" | "limit" | "total" | "totalPages" | "consumers">,
    requestedPage: number,
  ): void {
    expect(requestedPage).toEqual(data.totalPages);
    expect(data.consumers.length).toBeGreaterThan(0);
    expect(data.consumers.length).toBeLessThanOrEqual(data.limit);
  }
}
