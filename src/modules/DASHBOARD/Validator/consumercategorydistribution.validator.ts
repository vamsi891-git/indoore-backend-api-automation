import { expect } from "@playwright/test";
import {
  CONSUMER_CATEGORY_DISTRIBUTION_COLUMN_KEYS,
  categoryForScenario,
  consumerCategoryDistributionAccessTokenInvalidMessage,
  consumerCategoryDistributionSuccessMessage,
  consumerCategoryDistributionUnauthorizedMessage,
} from "../Data/consumercategorydistribution.data";
import {
  dtrUnbalanceAccessTokenInvalidCode,
  dtrUnbalanceUnauthorizedCode,
} from "../Data/dtr-unbalance-auth.data";
import type { ConsumerCategoryDistributionQuery } from "../Api/consumercategorydistribution.api";
import type {
  ConsumerCategoryDistributionErrorResponse,
  ConsumerCategoryDistributionResponse,
  ConsumerCategoryDistributionScenario,
  MappedConsumerCategoryDistribution,
} from "../Mapper/consumercategorydistribution.mapper";

export class ConsumerCategoryDistributionValidator {
  validateResponseEnvelope(
    response: ConsumerCategoryDistributionResponse,
  ): void {
    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
    expect(Array.isArray(response.data?.columns)).toBeTruthy();
    expect(Array.isArray(response.data?.rows)).toBeTruthy();
    expect(response.data?.pagination).toBeDefined();
    if (response.message != null) {
      expect(response.message).toBe(
        consumerCategoryDistributionSuccessMessage,
      );
    }
  }

  validateColumns(mapped: MappedConsumerCategoryDistribution): void {
    expect(mapped.columns.length).toBe(
      CONSUMER_CATEGORY_DISTRIBUTION_COLUMN_KEYS.length,
    );
    const keys = mapped.columns.map((c) => c.key);
    expect(new Set(keys).size).toBe(keys.length);
    mapped.columns.forEach((column) => {
      expect(column.key).toBeTruthy();
      expect(column.header).toBeTruthy();
    });
    expect(keys).toEqual([...CONSUMER_CATEGORY_DISTRIBUTION_COLUMN_KEYS]);
  }

  validateColumnKeysMatchRows(
    mapped: MappedConsumerCategoryDistribution,
  ): void {
    const columnKeys = mapped.columns.map((c) => c.key);
    for (const row of mapped.rows) {
      for (const key of columnKeys) {
        expect(Object.prototype.hasOwnProperty.call(row, key)).toBe(true);
      }
      if (row.id != null) {
        expect(String(row.id).trim().length).toBeGreaterThan(0);
      }
    }
  }

  validateRowShapes(mapped: MappedConsumerCategoryDistribution): void {
    for (const row of mapped.rows) {
      expect(Number(row.slNo)).toBeGreaterThan(0);
      expect(String(row.consumerName ?? "").trim().length).toBeGreaterThan(0);
      expect(String(row.ivrs ?? "").trim().length).toBeGreaterThan(0);
      expect(
        String(row.meterSerialNumber ?? "").trim().length,
      ).toBeGreaterThan(0);
      if (row.serviceDate != null) {
        expect(String(row.serviceDate).trim().length).toBeGreaterThan(0);
      }
    }
  }

  validatePagination(
    mapped: MappedConsumerCategoryDistribution,
    query: ConsumerCategoryDistributionQuery,
  ): void {
    const { page, limit, total, totalPages } = mapped.pagination;
    expect(page).toBe(query.page ?? 1);
    expect(limit).toBe(query.limit ?? 20);
    expect(page).toBeGreaterThan(0);
    expect(limit).toBeGreaterThan(0);
    expect(total).toBeGreaterThanOrEqual(0);
    expect(totalPages).toBeGreaterThanOrEqual(0);
    expect(mapped.rows.length).toBeLessThanOrEqual(limit);

    if (total === 0) {
      expect(totalPages).toBe(0);
      expect(mapped.rows.length).toBe(0);
      return;
    }

    expect(totalPages).toBe(Math.ceil(total / limit));
    if (totalPages === 1) {
      expect(total).toBeGreaterThanOrEqual(mapped.rows.length);
    }
    if (mapped.rows.length > 0) {
      expect(mapped.rows.length).toBeLessThanOrEqual(limit);
      const maxRowsForPage = Math.min(
        limit,
        Math.max(0, total - (page - 1) * limit),
      );
      if (maxRowsForPage > 0) {
        expect(mapped.rows.length).toBeLessThanOrEqual(maxRowsForPage);
      }
    }
    if (page < totalPages && total > 0) {
      expect(mapped.rows.length).toBeGreaterThan(0);
    }
  }

  validateLiveOk(
    mapped: MappedConsumerCategoryDistribution,
    query: ConsumerCategoryDistributionQuery,
  ): void {
    expect(mapped.success).toBeTruthy();
    expect(String(query.category).trim().length).toBeGreaterThan(0);
    this.validateColumns(mapped);
    this.validatePagination(mapped, query);
    this.validateColumnKeysMatchRows(mapped);
    this.validateRowShapes(mapped);
  }

  validateEmptyContract(mapped: MappedConsumerCategoryDistribution): void {
    this.validateColumns(mapped);
    expect(mapped.pagination.total).toBe(0);
    expect(mapped.pagination.totalPages).toBe(0);
    expect(mapped.rows.length).toBe(0);
  }

  validateWithRowsContract(mapped: MappedConsumerCategoryDistribution): void {
    this.validateColumns(mapped);
    expect(mapped.pagination.total).toBe(1);
    expect(mapped.pagination.totalPages).toBe(1);
    expect(mapped.rows.length).toBe(1);
    this.validateColumnKeysMatchRows(mapped);
    this.validateRowShapes(mapped);
    expect(mapped.rows[0]?.id).toBe("meter-10");
    expect(mapped.rows[0]?.meterSerialNumber).toBe("20151631");
  }

  validateAuthError(
    responseBody: ConsumerCategoryDistributionErrorResponse,
    expectedCode: string,
    expectedMessage: string,
  ): void {
    expect(responseBody.success).toBeFalsy();
    expect(responseBody.error).toBeDefined();
    expect(responseBody.error.code).toBe(expectedCode);
    expect(responseBody.error.message.toLowerCase()).toContain(
      expectedMessage.toLowerCase(),
    );
  }

  validateUnauthorizedError(
    responseBody: ConsumerCategoryDistributionErrorResponse,
  ): void {
    this.validateAuthError(
      responseBody,
      dtrUnbalanceUnauthorizedCode,
      consumerCategoryDistributionUnauthorizedMessage,
    );
  }

  validateAccessTokenInvalidError(
    responseBody: ConsumerCategoryDistributionErrorResponse,
  ): void {
    this.validateAuthError(
      responseBody,
      dtrUnbalanceAccessTokenInvalidCode,
      consumerCategoryDistributionAccessTokenInvalidMessage,
    );
  }

  validateScenario(
    mapped: MappedConsumerCategoryDistribution,
    scenario: ConsumerCategoryDistributionScenario,
    query?: ConsumerCategoryDistributionQuery,
  ): void {
    const category = categoryForScenario(scenario);
    const effectiveQuery: ConsumerCategoryDistributionQuery = query ?? {
      category,
      page: 1,
      limit: 20,
    };

    switch (scenario) {
      case "contract_residential_empty":
        this.validateEmptyContract(mapped);
        break;
      case "contract_residential":
      case "contract_commercial":
        this.validateWithRowsContract(mapped);
        break;
      case "dev_live_residential":
      case "dev_live_commercial":
      case "dev_live_industrial":
      case "dev_live_page_limit":
      case "dev_ignore_unknown_query":
        this.validateLiveOk(mapped, effectiveQuery);
        break;
      default:
        break;
    }
  }
}
