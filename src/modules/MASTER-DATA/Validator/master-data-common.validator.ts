import { expect } from "@playwright/test";
import type { ZodType } from "zod";
import { assertZodSchema } from "../../../core/utils/zod-validation.helper";
import type { MasterDataList } from "../Mapper/master-data-list.mapper";
import type { MasterDataListQuery } from "../Data/master-data.common.data";

export class MasterDataCommonValidator {
  static validateZodResponseSchema<T>(
    body: unknown,
    schema: ZodType<T>,
  ): T {
    return assertZodSchema(schema, body, "Zod Response Schema");
  }

  static validatePagination(data: MasterDataList<unknown>): void {
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

  static validateQueryParams(
    data: MasterDataList<unknown>,
    query: MasterDataListQuery,
  ): void {
    expect(data.page).toEqual(query.page ?? 1);
    expect(data.limit).toEqual(query.limit ?? 20);
  }

  static validateSlNoSequence(data: MasterDataList<{ slNo: number }>): void {
    const offset = (data.page - 1) * data.limit;
    data.items.forEach((item, index) => {
      expect(item.slNo).toEqual(offset + index + 1);
    });
  }

  static validateColumns(
    columns: Array<{ key: string; header: string }>,
  ): void {
    expect(columns.length).toBeGreaterThan(0);
    columns.forEach((col) => {
      expect(col.key.trim()).not.toEqual("");
      expect(col.header.trim()).not.toEqual("");
    });
  }

  static validateRowKeysMatchColumns(
    columns: Array<{ key: string; header: string }>,
    items: Record<string, unknown>[],
  ): void {
    const keys = columns.map((c) => c.key);
    items.forEach((item) => {
      keys.forEach((key) => {
        expect(item).toHaveProperty(key);
      });
    });
  }
}
