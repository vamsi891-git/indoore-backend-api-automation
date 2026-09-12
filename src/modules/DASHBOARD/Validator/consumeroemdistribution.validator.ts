import { expect } from "@playwright/test";
import {
  CONSUMER_OEM_DISTRIBUTION_COLUMN_KEYS,
  oemForScenario,
  consumerOemDistributionAccessTokenInvalidMessage,
  consumerOemDistributionSuccessMessage,
  consumerOemDistributionUnauthorizedMessage,
  type ConsumerOemAlias,
} from "../Data/consumeroemdistribution.data";
import {
  dtrUnbalanceAccessTokenInvalidCode,
  dtrUnbalanceUnauthorizedCode,
} from "../Data/dtr-unbalance-auth.data";
import type { ConsumerOemDistributionQuery } from "../Api/consumeroemdistribution.api";
import type {
  ConsumerOemDistributionErrorResponse,
  ConsumerOemDistributionResponse,
  ConsumerOemDistributionScenario,
  MappedConsumerOemDistribution,
} from "../Mapper/consumeroemdistribution.mapper";

/** Mirrors oemMetricsManufacturerPredicate — row manufacturerName must match query OEM. */
export function rowManufacturerMatchesOem(
  manufacturerName: unknown,
  oem: string,
): boolean {
  const name = String(manufacturerName ?? "")
    .trim()
    .toLowerCase();
  const normalized = oem.trim().toLowerCase();

  if (
    normalized === "l&t" ||
    normalized === "lnt" ||
    normalized.includes("l&t")
  ) {
    return (
      name.includes("l&t") ||
      name === "lnt" ||
      name.replace(/\s+/g, "") === "l&t"
    );
  }

  if (normalized.includes("linkwell")) {
    return name.includes("linkwell");
  }

  return name === normalized;
}

export class ConsumerOemDistributionValidator {
  validateResponseEnvelope(response: ConsumerOemDistributionResponse): void {
    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
    expect(Array.isArray(response.data?.columns)).toBeTruthy();
    expect(Array.isArray(response.data?.rows)).toBeTruthy();
    expect(response.data?.pagination).toBeDefined();
    if (response.message != null) {
      expect(response.message).toBe(consumerOemDistributionSuccessMessage);
    }
  }

  validateColumns(mapped: MappedConsumerOemDistribution): void {
    expect(mapped.columns.length).toBe(
      CONSUMER_OEM_DISTRIBUTION_COLUMN_KEYS.length,
    );
    const keys = mapped.columns.map((c) => c.key);
    expect(new Set(keys).size).toBe(keys.length);
    mapped.columns.forEach((column) => {
      expect(column.key).toBeTruthy();
      expect(column.header).toBeTruthy();
    });
    expect(keys).toEqual([...CONSUMER_OEM_DISTRIBUTION_COLUMN_KEYS]);
  }

  validateColumnKeysMatchRows(mapped: MappedConsumerOemDistribution): void {
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

  validateRowShapes(
    mapped: MappedConsumerOemDistribution,
    oem: string,
  ): void {
    for (const row of mapped.rows) {
      expect(Number(row.slNo)).toBeGreaterThan(0);
      expect(String(row.consumerName ?? "").trim().length).toBeGreaterThan(0);
      expect(String(row.ivrs ?? "").trim().length).toBeGreaterThan(0);
      expect(
        String(row.meterSerialNumber ?? "").trim().length,
      ).toBeGreaterThan(0);
      expect(rowManufacturerMatchesOem(row.manufacturerName, oem)).toBe(true);
      // address / lat / lng may be null for some meters
      if (row.consumerAddress != null) {
        expect(String(row.consumerAddress).trim().length).toBeGreaterThan(0);
      }
    }
  }

  validatePagination(
    mapped: MappedConsumerOemDistribution,
    query: ConsumerOemDistributionQuery,
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
      expect(total).toBe(mapped.rows.length);
    }
    if (page < totalPages) {
      expect(mapped.rows.length).toBe(limit);
    } else if (page === totalPages) {
      const remainder = total % limit;
      const expectedRows = remainder === 0 ? limit : remainder;
      expect(mapped.rows.length).toBe(expectedRows);
    }
  }

  validateLiveOk(
    mapped: MappedConsumerOemDistribution,
    query: ConsumerOemDistributionQuery,
  ): void {
    expect(mapped.success).toBeTruthy();
    this.validateColumns(mapped);
    this.validatePagination(mapped, query);
    this.validateColumnKeysMatchRows(mapped);
    this.validateRowShapes(mapped, query.oem);
  }

  validateEmptyContract(mapped: MappedConsumerOemDistribution): void {
    this.validateColumns(mapped);
    expect(mapped.pagination.total).toBe(0);
    expect(mapped.pagination.totalPages).toBe(0);
    expect(mapped.rows.length).toBe(0);
  }

  validateWithRowsContract(
    mapped: MappedConsumerOemDistribution,
    oem: ConsumerOemAlias,
  ): void {
    this.validateColumns(mapped);
    expect(mapped.pagination.total).toBe(1);
    expect(mapped.pagination.totalPages).toBe(1);
    expect(mapped.rows.length).toBe(1);
    this.validateColumnKeysMatchRows(mapped);
    this.validateRowShapes(mapped, oem);
    expect(mapped.rows[0]?.id).toBe("meter-10");
    expect(mapped.rows[0]?.meterSerialNumber).toBe("20151631");
  }

  validateAuthError(
    responseBody: ConsumerOemDistributionErrorResponse,
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
    responseBody: ConsumerOemDistributionErrorResponse,
  ): void {
    this.validateAuthError(
      responseBody,
      dtrUnbalanceUnauthorizedCode,
      consumerOemDistributionUnauthorizedMessage,
    );
  }

  validateAccessTokenInvalidError(
    responseBody: ConsumerOemDistributionErrorResponse,
  ): void {
    this.validateAuthError(
      responseBody,
      dtrUnbalanceAccessTokenInvalidCode,
      consumerOemDistributionAccessTokenInvalidMessage,
    );
  }

  validateScenario(
    mapped: MappedConsumerOemDistribution,
    scenario: ConsumerOemDistributionScenario,
    query?: ConsumerOemDistributionQuery,
  ): void {
    const oem = oemForScenario(scenario);
    const effectiveQuery: ConsumerOemDistributionQuery = query ?? {
      oem,
      page: 1,
      limit: 20,
    };

    switch (scenario) {
      case "contract_lt_empty":
        this.validateEmptyContract(mapped);
        break;
      case "contract_lt":
      case "contract_linkwell":
        this.validateWithRowsContract(mapped, oem);
        break;
      case "dev_live_lt":
      case "dev_live_linkwell":
      case "dev_live_page_limit":
      case "dev_ignore_unknown_query":
        this.validateLiveOk(mapped, effectiveQuery);
        break;
      default:
        break;
    }
  }
}
