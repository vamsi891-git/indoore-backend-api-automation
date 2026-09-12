import { expect } from "@playwright/test";
import {
  CONSUMER_PHASE_DISTRIBUTION_COLUMN_KEYS,
  phaseForScenario,
  consumerPhaseDistributionAccessTokenInvalidMessage,
  consumerPhaseDistributionSuccessMessage,
  consumerPhaseDistributionUnauthorizedMessage,
} from "../Data/consumerphasedistribution.data";
import {
  dtrUnbalanceAccessTokenInvalidCode,
  dtrUnbalanceUnauthorizedCode,
} from "../Data/dtr-unbalance-auth.data";
import type { ConsumerPhaseDistributionQuery } from "../Api/consumerphasedistribution.api";
import type {
  ConsumerPhase,
  ConsumerPhaseDistributionErrorResponse,
  ConsumerPhaseDistributionResponse,
  ConsumerPhaseDistributionScenario,
  MappedConsumerPhaseDistribution,
} from "../Mapper/consumerphasedistribution.mapper";

function compactPhase(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

/** Row meterPhase must fall in the same canonical bucket as the query phase. */
function rowPhaseMatchesQuery(
  rowPhase: unknown,
  phase: ConsumerPhase,
): boolean {
  const compact = compactPhase(rowPhase);
  switch (phase) {
    case "1 PH":
      return ["1ph", "1phase", "singlephase"].includes(compact);
    case "3 PH WC":
      return (
        ["3phwc", "threephasewc"].includes(compact) ||
        (compact.startsWith("3") &&
          compact.includes("wc") &&
          !compact.includes("4ct"))
      );
    case "3 PH 4 CT":
      return (
        ["3ph4ct", "3phct", "threephase4ct"].includes(compact) ||
        (compact.startsWith("3") &&
          compact.includes("4ct") &&
          !compact.includes("wc"))
      );
    case "HT":
      return ["ht", "hightension"].includes(compact);
    default:
      return false;
  }
}

export class ConsumerPhaseDistributionValidator {
  validateResponseEnvelope(
    response: ConsumerPhaseDistributionResponse,
  ): void {
    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
    expect(Array.isArray(response.data?.columns)).toBeTruthy();
    expect(Array.isArray(response.data?.rows)).toBeTruthy();
    expect(response.data?.pagination).toBeDefined();
    if (response.message != null) {
      expect(response.message).toBe(consumerPhaseDistributionSuccessMessage);
    }
  }

  validateColumns(mapped: MappedConsumerPhaseDistribution): void {
    expect(mapped.columns.length).toBe(
      CONSUMER_PHASE_DISTRIBUTION_COLUMN_KEYS.length,
    );
    const keys = mapped.columns.map((c) => c.key);
    expect(new Set(keys).size).toBe(keys.length);
    mapped.columns.forEach((column) => {
      expect(column.key).toBeTruthy();
      expect(column.header).toBeTruthy();
    });
    expect(keys).toEqual([...CONSUMER_PHASE_DISTRIBUTION_COLUMN_KEYS]);
  }

  validateColumnKeysMatchRows(
    mapped: MappedConsumerPhaseDistribution,
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

  validateRowShapes(
    mapped: MappedConsumerPhaseDistribution,
    phase: ConsumerPhase,
    options?: { requireAllRowsMatchPhase?: boolean },
  ): void {
    const requireAllRowsMatchPhase = options?.requireAllRowsMatchPhase ?? false;
    for (const row of mapped.rows) {
      expect(Number(row.slNo)).toBeGreaterThan(0);
      expect(String(row.consumerName ?? "").trim().length).toBeGreaterThan(0);
      expect(String(row.ivrs ?? "").trim().length).toBeGreaterThan(0);
      expect(
        String(row.meterSerialNumber ?? "").trim().length,
      ).toBeGreaterThan(0);
      if (requireAllRowsMatchPhase) {
        expect(rowPhaseMatchesQuery(row.meterPhase, phase)).toBe(true);
      }
      if (row.serviceDate != null) {
        expect(String(row.serviceDate).trim().length).toBeGreaterThan(0);
      }
    }
    if (!requireAllRowsMatchPhase && mapped.rows.length > 0) {
      expect(
        mapped.rows.some((row) => rowPhaseMatchesQuery(row.meterPhase, phase)),
      ).toBe(true);
    }
  }

  validatePagination(
    mapped: MappedConsumerPhaseDistribution,
    query: ConsumerPhaseDistributionQuery,
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
    mapped: MappedConsumerPhaseDistribution,
    query: ConsumerPhaseDistributionQuery,
  ): void {
    expect(mapped.success).toBeTruthy();
    this.validateColumns(mapped);
    this.validatePagination(mapped, query);
    this.validateColumnKeysMatchRows(mapped);
    this.validateRowShapes(mapped, query.phase);
  }

  validateEmptyContract(mapped: MappedConsumerPhaseDistribution): void {
    this.validateColumns(mapped);
    expect(mapped.pagination.total).toBe(0);
    expect(mapped.pagination.totalPages).toBe(0);
    expect(mapped.rows.length).toBe(0);
  }

  validateWithRowsContract(
    mapped: MappedConsumerPhaseDistribution,
    phase: ConsumerPhase,
  ): void {
    this.validateColumns(mapped);
    expect(mapped.pagination.total).toBe(1);
    expect(mapped.pagination.totalPages).toBe(1);
    expect(mapped.rows.length).toBe(1);
    this.validateColumnKeysMatchRows(mapped);
    this.validateRowShapes(mapped, phase, { requireAllRowsMatchPhase: true });
    expect(mapped.rows[0]?.id).toBe("meter-10");
    expect(mapped.rows[0]?.meterSerialNumber).toBe("20151631");
  }

  validateAuthError(
    responseBody: ConsumerPhaseDistributionErrorResponse,
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
    responseBody: ConsumerPhaseDistributionErrorResponse,
  ): void {
    this.validateAuthError(
      responseBody,
      dtrUnbalanceUnauthorizedCode,
      consumerPhaseDistributionUnauthorizedMessage,
    );
  }

  validateAccessTokenInvalidError(
    responseBody: ConsumerPhaseDistributionErrorResponse,
  ): void {
    this.validateAuthError(
      responseBody,
      dtrUnbalanceAccessTokenInvalidCode,
      consumerPhaseDistributionAccessTokenInvalidMessage,
    );
  }

  validateScenario(
    mapped: MappedConsumerPhaseDistribution,
    scenario: ConsumerPhaseDistributionScenario,
    query?: ConsumerPhaseDistributionQuery,
  ): void {
    const phase = phaseForScenario(scenario);
    const effectiveQuery: ConsumerPhaseDistributionQuery = query ?? {
      phase,
      page: 1,
      limit: 20,
    };

    switch (scenario) {
      case "contract_1ph_empty":
        this.validateEmptyContract(mapped);
        break;
      case "contract_1ph":
      case "contract_3ph_wc":
        this.validateWithRowsContract(mapped, phase);
        break;
      case "dev_live_1ph":
      case "dev_live_3ph_wc":
      case "dev_live_3ph_4ct":
      case "dev_live_ht":
      case "dev_live_page_limit":
      case "dev_ignore_unknown_query":
        this.validateLiveOk(mapped, effectiveQuery);
        break;
      default:
        break;
    }
  }
}
