import { expect } from "@playwright/test";
import type {
  MappedMinMaxVoltageCount,
  MinMaxVoltageCountErrorBody,
  MinMaxVoltageCountResponse,
  MinMaxVoltageCountScenario,
} from "../Mapper/minmaxvoltagecount.mapper";
import { minMaxVoltageCountDataKeys } from "../Mapper/minmaxvoltagecount.mapper";

export class MinMaxVoltageCountValidator {
  validateResponseEnvelope(response: MinMaxVoltageCountResponse): void {
    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
    expect(response.data).not.toBeNull();
  }

  validateValidationError(responseBody: MinMaxVoltageCountErrorBody): void {
    expect(responseBody.success).toBeFalsy();
    expect(responseBody.error).toBeDefined();
    expect(responseBody.error?.code).toBe("VALIDATION_ERROR");
    expect(responseBody.error?.message).toBeTruthy();
  }

  validateLiveOk(mapped: MappedMinMaxVoltageCount): void {
    expect(mapped.success).toBeTruthy();
    expect(typeof mapped.total).toBe("number");
    expect(Number.isInteger(mapped.total)).toBeTruthy();
    expect(mapped.total).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(mapped.total)).toBeTruthy();
    if (mapped.totalIsExact != null) {
      expect(typeof mapped.totalIsExact).toBe("boolean");
    }
  }

  validateDataKeys(response: MinMaxVoltageCountResponse): void {
    const data = response.data ?? {};
    for (const key of minMaxVoltageCountDataKeys) {
      expect(data).toHaveProperty(key);
    }
  }

  /**
   * Count total must match the list report pagination.total for the same filters.
   * Do not pin a live number (it can grow).
   */
  validateMatchesListTotal(
    mapped: MappedMinMaxVoltageCount,
    listTotal: number,
  ): void {
    expect(mapped.total).toBe(listTotal);
  }

  validateLiveFullContract(mapped: MappedMinMaxVoltageCount): void {
    this.validateLiveOk(mapped);
    expect(mapped.total).toBe(10);
    expect(mapped.totalIsExact).toBe(true);
  }

  validateEmptyContract(mapped: MappedMinMaxVoltageCount): void {
    this.validateLiveOk(mapped);
    expect(mapped.total).toBe(0);
    expect(mapped.totalIsExact).toBe(true);
  }

  validateScenario(
    mapped: MappedMinMaxVoltageCount,
    scenario: MinMaxVoltageCountScenario,
    listTotal?: number,
  ): void {
    switch (scenario) {
      case "contract_live_full":
        this.validateLiveFullContract(mapped);
        break;
      case "contract_empty":
        this.validateEmptyContract(mapped);
        break;
      case "dev_live_primary":
      case "dev_live_min_y":
      case "dev_live_min_b":
      case "dev_live_max_r":
      case "dev_live_max_y":
      case "dev_live_max_b":
        this.validateLiveOk(mapped);
        if (listTotal !== undefined) {
          this.validateMatchesListTotal(mapped, listTotal);
        }
        break;
      case "dev_ignore_unknown_query":
      case "dev_ignore_page_limit":
      case "dev_empty_window":
        this.validateLiveOk(mapped);
        break;
      default:
        break;
    }
  }
}
