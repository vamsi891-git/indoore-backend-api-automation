import { expect } from "@playwright/test";
import type {
  ConsumerConnectionDetails,
  ConsumerConnectionMeterDetails,
  ConsumerLatestActivity,
  ConsumerProfileData,
  ConsumerProfileErrorResponse,
  ConsumerProfileScenario,
} from "../Mapper/consumerprofile.mapper";

const PROFILE_REQUIRED_FIELDS = [
  "consumerName",
  "consumerEmail",
  "consumerNumber",
  "uniqueId",
  "meterSerialNumber",
  "permanentAddress",
  "billingAddress",
  "connectionDetails",
  "connectionMeterDetails",
  "latestActivities",
] as const;

const CONNECTION_DETAIL_FIELDS = [
  "division",
  "zone",
  "subStation",
  "feeder",
  "dtr",
  "ivrsNo",
  "sanctionedLoad",
  "sanctionedLoadKw",
] as const;

const CONNECTION_METER_FIELDS = [
  "mainSubMeter",
  "meterSerialNumber",
  "servicePointId",
  "meterType",
  "meterPhase",
] as const;

const KNOWN_METER_PHASES = ["1 PH", "3PH WC", "3PH 4CT", "HT"];

export class ConsumerProfileValidator {
  validateSuccess(success: boolean) {
    expect(success).toBeTruthy();
  }

  validateRequiredFields(data: ConsumerProfileData) {
    PROFILE_REQUIRED_FIELDS.forEach((field) => {
      expect(data).toHaveProperty(field);
    });
  }

  validateConsumerName(data: ConsumerProfileData) {
    expect(typeof data.consumerName).toBe("string");
    expect(data.consumerName.trim().length).toBeGreaterThan(0);
  }

  validateConsumerEmail(data: ConsumerProfileData) {
    if (data.consumerEmail == null) {
      return;
    }
    expect(typeof data.consumerEmail).toBe("string");
    expect(data.consumerEmail).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  }

  validateConsumerNumber(data: ConsumerProfileData) {
    expect(data.consumerNumber).toBeTruthy();
    expect(typeof data.consumerNumber).toBe("string");
    expect(String(data.consumerNumber).trim().length).toBeGreaterThan(0);
  }

  validateUniqueId(data: ConsumerProfileData) {
    expect(data.uniqueId).toBeTruthy();
    expect(String(data.uniqueId).trim().length).toBeGreaterThan(0);
  }

  validateMeterSerialNumber(data: ConsumerProfileData) {
    expect(data.meterSerialNumber).toBeTruthy();
    expect(String(data.meterSerialNumber).trim().length).toBeGreaterThan(0);
  }

  validateAddresses(data: ConsumerProfileData) {
    expect(data.permanentAddress).toBeTruthy();
    expect(data.billingAddress).toBeTruthy();
    expect(String(data.permanentAddress).trim().length).toBeGreaterThan(0);
    expect(String(data.billingAddress).trim().length).toBeGreaterThan(0);
  }

  validateConnectionDetailsShape(details: ConsumerConnectionDetails) {
    CONNECTION_DETAIL_FIELDS.forEach((field) => {
      expect(details).toHaveProperty(field);
    });
  }

  validateConnectionDetails(data: ConsumerProfileData) {
    const details = data.connectionDetails;
    expect(details).toBeDefined();
    this.validateConnectionDetailsShape(details);

    expect(details.subStation).toBeTruthy();
    expect(details.feeder).toBeTruthy();
    expect(details.dtr).toBeTruthy();
    expect(details.ivrsNo).toBe(data.consumerNumber);

    if (details.division != null) {
      expect(String(details.division).trim().length).toBeGreaterThan(0);
    }
    if (details.zone != null) {
      expect(String(details.zone).trim().length).toBeGreaterThan(0);
    }
  }

  validateSanctionedLoad(details: ConsumerConnectionDetails) {
    expect(details.sanctionedLoad).toBeTruthy();
    expect(String(details.sanctionedLoad)).toMatch(/kW/i);
    expect(details.sanctionedLoadKw).not.toBeNull();
    expect(Number(details.sanctionedLoadKw)).toBeGreaterThanOrEqual(0);
  }

  validateConnectionMeterDetailsShape(
    meter: ConsumerConnectionMeterDetails,
  ) {
    CONNECTION_METER_FIELDS.forEach((field) => {
      expect(meter).toHaveProperty(field);
    });
  }

  validateConnectionMeterDetails(data: ConsumerProfileData) {
    const meter = data.connectionMeterDetails;
    expect(meter).toBeDefined();
    this.validateConnectionMeterDetailsShape(meter);

    expect(meter.mainSubMeter).toBeTruthy();
    expect(meter.servicePointId).toBeTruthy();
    expect(meter.meterSerialNumber).toBe(data.meterSerialNumber);
    expect(String(meter.meterType)).toMatch(/Meter/i);
    expect(meter.meterPhase).toBeTruthy();
  }

  validateMeterPhase(meter: ConsumerConnectionMeterDetails) {
    const phase = String(meter.meterPhase).trim();
    expect(phase.length).toBeGreaterThan(0);
    const known = KNOWN_METER_PHASES.includes(phase);
    const looksLikePhase = /\d\s*PH|PHASE|HT/i.test(phase);
    expect(known || looksLikePhase).toBeTruthy();
  }

  validateLatestActivities(activities: ConsumerLatestActivity[]) {
    expect(Array.isArray(activities)).toBeTruthy();
    for (const activity of activities) {
      expect(typeof activity.title).toBe("string");
      expect(typeof activity.timestamp).toBe("string");
      expect(activity.timestamp.trim().length).toBeGreaterThan(0);
    }
  }

  validateIdentityEcho(
    data: ConsumerProfileData,
    options: {
      routeRef?: string;
      expectedUniqueId?: string;
      expectedConsumerNumber?: string;
    } = {},
  ) {
    if (options.expectedUniqueId) {
      expect(data.uniqueId).toBe(options.expectedUniqueId);
    }
    if (options.expectedConsumerNumber) {
      expect(data.consumerNumber).toBe(options.expectedConsumerNumber);
    }
    if (options.routeRef && !options.routeRef.startsWith("meter-")) {
      const ref = options.routeRef.trim();
      const matchesRoute =
        data.uniqueId === ref ||
        data.consumerNumber === ref ||
        data.connectionDetails.ivrsNo === ref;
      expect(matchesRoute).toBeTruthy();
    }
  }

  validateBusinessRules(data: ConsumerProfileData) {
    expect(data.connectionDetails.ivrsNo).toBe(data.consumerNumber);
    expect(data.connectionMeterDetails.meterSerialNumber).toBe(
      data.meterSerialNumber,
    );
  }

  validateNotFoundError(responseBody: ConsumerProfileErrorResponse) {
    expect(responseBody.success).toBeFalsy();
    expect(responseBody.error).toBeDefined();
    expect(responseBody.error.code).toBe("CONSUMER_NOT_FOUND");
    expect(responseBody.error.message.toLowerCase()).toContain(
      "consumer not found",
    );
  }

  validateScenario(
    mapped: ConsumerProfileData & { success: boolean },
    scenario: ConsumerProfileScenario,
    options: {
      routeRef?: string;
      expectedUniqueId?: string;
      expectedConsumerNumber?: string;
    } = {},
  ) {
    this.validateSuccess(mapped.success);
    this.validateRequiredFields(mapped);
    this.validateConsumerName(mapped);
    this.validateConsumerEmail(mapped);
    this.validateConsumerNumber(mapped);
    this.validateUniqueId(mapped);
    this.validateMeterSerialNumber(mapped);
    this.validateAddresses(mapped);
    this.validateConnectionDetails(mapped);
    this.validateSanctionedLoad(mapped.connectionDetails);
    this.validateConnectionMeterDetails(mapped);
    this.validateMeterPhase(mapped.connectionMeterDetails);
    this.validateLatestActivities(mapped.latestActivities);
    this.validateBusinessRules(mapped);
    this.validateIdentityEcho(mapped, options);

    if (scenario === "profile_by_ivrs" && options.routeRef) {
      expect(mapped.consumerNumber).toBe(options.routeRef);
    }
  }
}
