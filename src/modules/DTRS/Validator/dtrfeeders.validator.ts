import { expect } from "@playwright/test";
import {
  dtrFeedersAllowedStatuses,
  dtrFeedersFields,
} from "../Data/dtrfeeders.data";
import type {
  DtrFeedersErrorResponse,
  DtrFeedersResponse,
  DtrFeedersScenario,
  FeederItem,
  MappedDtrFeeders,
} from "../Mapper/dtrfeeders.mapper";

const IST_DATE_TIME =
  /^\d{1,2}[\s/-](?:\w{3}|\d{2})[\s/-]\d{4}.+\d{1,2}:\d{2}|^\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}/i;

export class DtrFeedersValidator {
  validateSuccess(success: boolean): void {
    expect(success).toBeTruthy();
  }

  validateNotFoundError(responseBody: DtrFeedersErrorResponse): void {
    expect(responseBody.success).toBeFalsy();
    expect(responseBody.error).toBeDefined();
    expect(responseBody.error.code).toBe("DTR_NOT_FOUND");
    expect(responseBody.error.message.toLowerCase()).toContain("dtr not found");
  }

  validateBlankCodeError(responseBody: DtrFeedersErrorResponse): void {
    expect(responseBody.success).toBeFalsy();
    expect(responseBody.error).toBeDefined();
    expect(responseBody.error.code).toBe("VALIDATION_ERROR");
    expect(responseBody.error.message.toLowerCase()).toMatch(
      /dtr|network|code/i,
    );
  }

  validateResponseEnvelope(response: DtrFeedersResponse): void {
    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
  }

  validateFields(data: MappedDtrFeeders): void {
    expect(data).toHaveProperty("feeders");
    expect(Array.isArray(data.feeders)).toBeTruthy();
  }

  validateFeederStructure(feeders: FeederItem[]): void {
    feeders.forEach((feeder) => {
      expect(Object.keys(feeder).sort()).toEqual([...dtrFeedersFields].sort());
      expect(typeof feeder.id).toBe("string");
      expect(feeder.name === null || typeof feeder.name === "string").toBeTruthy();
      expect(typeof feeder.status).toBe("string");
      expect(
        feeder.lastCommunication === null ||
          typeof feeder.lastCommunication === "string",
      ).toBeTruthy();
    });
  }

  validateStatuses(feeders: FeederItem[]): void {
    feeders.forEach((feeder) => {
      expect([...dtrFeedersAllowedStatuses]).toContain(feeder.status);
    });
  }

  validateFeederIds(feeders: FeederItem[]): void {
    feeders.forEach((feeder) => {
      expect(feeder.id.trim().length).toBeGreaterThan(0);
    });
  }

  validateLastCommunicationFormat(feeders: FeederItem[]): void {
    feeders.forEach((feeder) => {
      if (feeder.lastCommunication !== null) {
        expect(IST_DATE_TIME.test(feeder.lastCommunication.trim())).toBeTruthy();
      }
    });
  }

  validateUniqueIds(feeders: FeederItem[]): void {
    const ids = feeders.map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
  }

  validateFeederOrder(feeders: FeederItem[]): void {
    if (feeders.length <= 1) {
      return;
    }
    for (let i = 1; i < feeders.length; i++) {
      expect(feeders[i].id.localeCompare(feeders[i - 1].id)).toBeGreaterThanOrEqual(
        0,
      );
    }
  }

  validateEmptyStatus(feeders: FeederItem[]): void {
    feeders.forEach((feeder) => {
      expect(feeder.status.trim().length).toBeGreaterThan(0);
    });
  }

  validateFeedersArray(feeders: FeederItem[]): void {
    expect(Array.isArray(feeders)).toBeTruthy();
  }

  validateLiveOk(mapped: MappedDtrFeeders): void {
    this.validateSuccess(mapped.success);
    this.validateFields(mapped);
    this.validateFeedersArray(mapped.feeders);
    this.validateFeederStructure(mapped.feeders);
    this.validateStatuses(mapped.feeders);
    if (mapped.feeders.length > 0) {
      this.validateFeederIds(mapped.feeders);
      this.validateUniqueIds(mapped.feeders);
      this.validateFeederOrder(mapped.feeders);
      this.validateEmptyStatus(mapped.feeders);
      this.validateLastCommunicationFormat(mapped.feeders);
    }
  }

  validateEmptyFeedersContract(mapped: MappedDtrFeeders): void {
    this.validateLiveOk(mapped);
    expect(mapped.feeders).toEqual([]);
  }

  validatePopulatedFeedersContract(mapped: MappedDtrFeeders): void {
    this.validateLiveOk(mapped);
    expect(mapped.feeders.length).toBe(3);
    expect(mapped.feeders[0].id).toBe("LT-FDR-001");
    expect(mapped.feeders[0].name).toBe("LT Feeder Alpha");
    expect(mapped.feeders[0].status).toBe("Active");
    expect(mapped.feeders[1].lastCommunication).toBe("09-07-2026 14:30:15");
    expect(mapped.feeders[2].status).toBe("Inactive");
  }

  validateMixedStatusesContract(mapped: MappedDtrFeeders): void {
    this.validateLiveOk(mapped);
    const statuses = mapped.feeders.map((f) => f.status);
    expect(statuses).toContain("Active");
    expect(statuses).toContain("Inactive");
    expect(mapped.feeders.find((f) => f.id === "FDR-I")?.name).toBeNull();
  }

  validateNumericIdFallbackContract(mapped: MappedDtrFeeders): void {
    this.validateLiveOk(mapped);
    expect(mapped.feeders[0].id).toBe("987654");
    expect(/^\d+$/.test(mapped.feeders[0].id)).toBeTruthy();
  }

  validateWithCommunicationContract(mapped: MappedDtrFeeders): void {
    this.validateLiveOk(mapped);
    expect(mapped.feeders[0].lastCommunication).toBe("09-07-2026 08:45:00");
    expect(mapped.feeders[1].lastCommunication).toBeNull();
    this.validateLastCommunicationFormat(mapped.feeders);
  }

  validateScenario(
    mapped: MappedDtrFeeders,
    scenario: DtrFeedersScenario,
  ): void {
    switch (scenario) {
      case "contract_empty_feeders":
        this.validateEmptyFeedersContract(mapped);
        break;
      case "contract_populated_feeders":
        this.validatePopulatedFeedersContract(mapped);
        break;
      case "contract_mixed_statuses":
        this.validateMixedStatusesContract(mapped);
        break;
      case "contract_numeric_id_fallback":
        this.validateNumericIdFallbackContract(mapped);
        break;
      case "contract_with_communication":
        this.validateWithCommunicationContract(mapped);
        break;
      case "dfe_by_code_primary":
      case "dfe_by_code_alt":
      case "dfe_ignore_unknown_query":
        this.validateLiveOk(mapped);
        break;
      default:
        break;
    }
  }
}
