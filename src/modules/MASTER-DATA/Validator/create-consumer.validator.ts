import { expect } from "@playwright/test";
import type { CreateConsumerRequestBody } from "../Data/create-consumer.data";
import { createConsumerExpectedSuccessMessage } from "../Data/create-consumer.data";
import {
  CREATE_SUCCESS_FIELDS,
  CreateConsumerMapped,
  CreateConsumerResponseData,
  CreateConsumerScenario,
  REQUEST_ECHO_FIELDS,
} from "../Mapper/create-consumer.mapper";
import { ConsumerProfileResponse } from "../../CONSUMERS/Mapper/consumerprofile.mapper";

const NUMERIC_RESPONSE_FIELDS = [
  "Total Demand (KVA)",
  "Sanctioned Load (KW)",
  "Sanctioned Load (HP)",
  "Connected KVA",
  "Connected KW",
  "Connected HP",
  "Rated KVA",
  "Rated KW",
  "Bill Day",
  "Meter Initial Reading",
] as const;

const BOOLEAN_RESPONSE_FIELDS = ["Connected To DCU", "Is Net Meter"] as const;

const LOOKUP_DISPLAY_FIELDS = [
  "Connection Type",
  "Consumer Category",
  "Connection Status",
] as const;

const KNOWN_ERROR_CODES = [
  "VALIDATION_ERROR",
  "METER_NOT_FOUND",
  "METER_ALREADY_ASSIGNED",
  "METER_INACTIVE",
  "METER_WRONG_ZONE",
  "ORGANISATION_MISMATCH",
  "OUT_OF_SCOPE",
  "CONSUMER_CID_EXISTS",
  "IVRS_EXISTS",
] as const;

const PIN_CODE_FORMAT = /^\d{6}$/;
const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_FORMAT = /^\d{10}$/;
const ISO_DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;

export class CreateConsumerValidator {
  validateResponse(mapped: CreateConsumerMapped): void {
    expect(mapped).toBeDefined();
  }

  validateCreateSuccess(mapped: CreateConsumerMapped): void {
    expect(
      mapped.isCreateSuccess,
      "Backend must not accept invalid consumer payload (success must be true with data)",
    ).toBeTruthy();
    expect(mapped.data).not.toBeNull();
  }

  validateSuccessMessage(mapped: CreateConsumerMapped): void {
    expect(mapped.message).toBe(createConsumerExpectedSuccessMessage);
  }

  validateRootStructure(mapped: CreateConsumerMapped): void {
    expect(mapped.data).toBeDefined();
    expect(typeof mapped.data).toBe("object");
  }

  validateRequiredResponseFields(data: CreateConsumerResponseData): void {
    CREATE_SUCCESS_FIELDS.forEach((field) => {
      expect(
        Object.prototype.hasOwnProperty.call(data, field),
        `Missing response field: ${field}`,
      ).toBeTruthy();
      expect(data[field]).toBeTruthy();
    });
  }

  validateStringFields(data: CreateConsumerResponseData): void {
    const stringFields = [
      "Consumer ID",
      "Consumer Name",
      "Mobile No.",
      "Address",
      "IVRS Number",
      "Account ID",
      "MSN",
    ] as const;

    stringFields.forEach((field) => {
      expect(
        Object.prototype.hasOwnProperty.call(data, field),
        `Missing string field: ${field}`,
      ).toBeTruthy();
      expect(typeof data[field]).toBe("string");
      expect(String(data[field]).trim().length).toBeGreaterThan(0);
    });
  }

  validateOptionalStringFields(data: CreateConsumerResponseData): void {
    const optional = [
      "Father Name",
      "Email ID",
      "Land Line No.",
      "Pin Code",
      "Sub Station",
      "Feeder",
      "DTR",
      "Nearest Acct. ID",
      "Nature Of Business",
      "Billing Cycle",
      "TOD",
      "MR Code",
      "Main/Sub Meter",
      "Service Point ID",
      "Date Of Service",
      "SIM No.",
      "IMSI No.",
      "Mobile No. (Meter)",
      "IP Address",
      "Modem Serial Number",
      "Modem IMEI",
      "Connected Phase",
      "Activate/Deactivate Remarks",
    ] as const;

    optional.forEach((field) => {
      if (data[field] == null) {
        return;
      }
      expect(typeof data[field]).toBe("string");
    });
  }

  validateNumericFields(data: CreateConsumerResponseData): void {
    NUMERIC_RESPONSE_FIELDS.forEach((field) => {
      if (data[field] == null) {
        return;
      }
      expect(typeof data[field]).toBe("number");
      expect(Number.isFinite(data[field] as number)).toBeTruthy();
    });
  }

  validateBooleanFields(data: CreateConsumerResponseData): void {
    BOOLEAN_RESPONSE_FIELDS.forEach((field) => {
      if (data[field] == null) {
        return;
      }
      expect(typeof data[field]).toBe("boolean");
    });
  }

  validateLookupDisplayFields(data: CreateConsumerResponseData): void {
    LOOKUP_DISPLAY_FIELDS.forEach((field) => {
      if (data[field] == null) {
        return;
      }
      const value = data[field];
      expect(
        typeof value === "string" || typeof value === "number",
      ).toBeTruthy();
      if (typeof value === "string") {
        expect(value.trim().length).toBeGreaterThan(0);
      }
    });
  }

  validateFormats(data: CreateConsumerResponseData): void {
    if (data["Pin Code"] != null) {
      expect(PIN_CODE_FORMAT.test(String(data["Pin Code"]))).toBeTruthy();
    }
    if (data["Email ID"] != null) {
      expect(EMAIL_FORMAT.test(String(data["Email ID"]))).toBeTruthy();
    }
    if (data["Mobile No."] != null) {
      expect(MOBILE_FORMAT.test(String(data["Mobile No."]))).toBeTruthy();
    }
    if (data["Date Of Service"] != null) {
      expect(
        ISO_DATE_FORMAT.test(String(data["Date Of Service"])),
      ).toBeTruthy();
    }
    if (data["MSN"] != null) {
      expect(String(data["MSN"]).trim().length).toBeGreaterThan(0);
    }
  }

  validateNonNegativeLoads(data: CreateConsumerResponseData): void {
    const loadFields = [
      "Total Demand (KVA)",
      "Sanctioned Load (KW)",
      "Sanctioned Load (HP)",
      "Connected KVA",
      "Connected KW",
      "Connected HP",
      "Rated KVA",
      "Rated KW",
      "Meter Initial Reading",
    ] as const;

    loadFields.forEach((field) => {
      if (data[field] == null) {
        return;
      }
      expect(data[field] as number).toBeGreaterThanOrEqual(0);
    });
  }

  validateBillDay(data: CreateConsumerResponseData): void {
    if (data["Bill Day"] == null) {
      return;
    }
    const day = data["Bill Day"] as number;
    expect(day).toBeGreaterThanOrEqual(1);
    expect(day).toBeLessThanOrEqual(31);
  }

  validateRequestEcho(
    data: CreateConsumerResponseData,
    request: CreateConsumerRequestBody,
  ): void {
    REQUEST_ECHO_FIELDS.forEach(({ requestKey, responseKey }) => {
      const sent = request[requestKey];
      if (sent == null || sent === "") {
        return;
      }
      if (!(responseKey in data)) {
        return;
      }
      const actual = data[responseKey];
      if (typeof sent === "number" && typeof actual === "number") {
        expect(actual).toBe(sent);
        return;
      }
      if (typeof sent === "number" && typeof actual === "string") {
        return;
      }
      expect(actual).toBe(sent);
    });
  }

  validateLookupEcho(
    data: CreateConsumerResponseData,
    request: CreateConsumerRequestBody,
  ): void {
    const lookupChecks: Array<{
      requestKey: keyof CreateConsumerRequestBody | string;
      responseKey: string;
      pattern: RegExp;
    }> = [
      {
        requestKey: "Connection Type",
        responseKey: "Connection Type",
        pattern: /prepaid/i,
      },
      {
        requestKey: "Consumer Category",
        responseKey: "Consumer Category",
        pattern: /commercial|lv/i,
      },
      {
        requestKey: "Connection Status",
        responseKey: "Connection Status",
        pattern: /connect|active/i,
      },
      {
        requestKey: "Billing Cycle",
        responseKey: "Billing Cycle",
        pattern: /month|cycle|\d/i,
      },
      {
        requestKey: "Main/Sub Meter",
        responseKey: "Main/Sub Meter",
        pattern: /main|sub|\d/i,
      },
    ];

    lookupChecks.forEach(({ requestKey, responseKey, pattern }) => {
      if (request[requestKey] == null || data[responseKey] == null) {
        return;
      }
      expect(pattern.test(String(data[responseKey]))).toBeTruthy();
    });
  }

  validateBusinessRules(data: CreateConsumerResponseData): void {
    expect(String(data["Consumer ID"]).trim().length).toBeGreaterThan(0);
    expect(String(data["Consumer Name"]).trim().length).toBeGreaterThan(0);
    expect(String(data["IVRS Number"]).trim().length).toBeGreaterThan(0);
    expect(String(data["Account ID"]).trim().length).toBeGreaterThan(0);
  }

  validateErrorStructure(mapped: CreateConsumerMapped): void {
    expect(mapped.success).toBeFalsy();
    expect(mapped.error).not.toBeNull();
    expect(mapped.error!.code).toBeTruthy();
    expect(mapped.error!.message).toBeTruthy();
  }

  validateKnownErrorCode(mapped: CreateConsumerMapped): void {
    if (!mapped.error?.code) {
      return;
    }
    expect(KNOWN_ERROR_CODES).toContain(mapped.error.code);
  }

  validateValidationError(mapped: CreateConsumerMapped): void {
    expect(mapped.error?.code).toBe("VALIDATION_ERROR");
    expect(mapped.error?.message.trim().length).toBeGreaterThan(0);
  }

  validateValidationFieldHint(
    mapped: CreateConsumerMapped,
    validationField?: string,
  ): void {
    if (!validationField) {
      return;
    }
    const message = mapped.error?.message ?? "";
    const fieldErrors = (
      mapped.error?.details as { fieldErrors?: Record<string, string[]> }
    )?.fieldErrors?.[validationField];
    const hasFieldErrors = Array.isArray(fieldErrors) && fieldErrors.length > 0;
    expect(
      message.toLowerCase().includes(validationField.toLowerCase()) ||
        hasFieldErrors,
      `Expected validation error for ${validationField}`,
    ).toBeTruthy();
  }

  validateMeterConflict(mapped: CreateConsumerMapped): void {
    if (mapped.error?.code !== "METER_ALREADY_ASSIGNED") {
      return;
    }
    expect(mapped.error.message.toLowerCase()).toContain("assigned");
  }

  validateMeterNotFound(mapped: CreateConsumerMapped): void {
    if (mapped.error?.code !== "METER_NOT_FOUND") {
      return;
    }
    expect(mapped.error.message.toLowerCase()).toMatch(/meter|scope|exist/);
  }

  validateMeterInactive(mapped: CreateConsumerMapped): void {
    if (mapped.error?.code !== "METER_INACTIVE") {
      return;
    }
    expect(mapped.error.message.toLowerCase()).toMatch(/inactive|active/);
  }

  validateDuplicateConsumer(mapped: CreateConsumerMapped): void {
    if (mapped.error?.code !== "CONSUMER_CID_EXISTS") {
      return;
    }
    expect(mapped.error.message.toLowerCase()).toContain("consumer");
  }

  validateSuccessBackendRules(
    mapped: CreateConsumerMapped,
    request: CreateConsumerRequestBody,
  ): void {
    this.validateCreateSuccess(mapped);
    this.validateSuccessMessage(mapped);
    const data = mapped.data!;
    this.validateRootStructure(mapped);
    this.validateRequiredResponseFields(data);
    this.validateStringFields(data);
    this.validateOptionalStringFields(data);
    this.validateNumericFields(data);
    this.validateBooleanFields(data);
    this.validateLookupDisplayFields(data);
    this.validateFormats(data);
    this.validateNonNegativeLoads(data);
    this.validateBillDay(data);
    this.validateRequestEcho(data, request);
    this.validateLookupEcho(data, request);
    this.validateBusinessRules(data);
  }

  validateErrorBackendRules(
    mapped: CreateConsumerMapped,
    _validationField?: string,
  ): void {
    this.validateErrorStructure(mapped);
    this.validateKnownErrorCode(mapped);
    this.validateValidationError(mapped);
  }

  validatePostCreateConsumerNotFound(response: ConsumerProfileResponse): void {
    expect(response.success).toBeFalsy();
    expect(response.error?.code).toBe("CONSUMER_NOT_FOUND");
  }

  validatePostCreateProfileExists(response: ConsumerProfileResponse): void {
    expect(response.success).toBeTruthy();
    expect(response.data).toBeDefined();
  }

  validatePostCreateProfilePersistence(
    response: ConsumerProfileResponse,
    request: CreateConsumerRequestBody,
  ): void {
    const profile = response.data;
    expect(profile).toBeDefined();

    expect(String(profile.consumerName).trim()).toBe(
      String(request["Consumer Name"]).trim(),
    );

    const msn = String(request["MSN"] ?? "").trim();
    if (msn) {
      expect(String(profile.meterSerialNumber).trim()).toBe(msn);
      expect(
        String(profile.connectionMeterDetails?.meterSerialNumber ?? "").trim(),
      ).toBe(msn);
    }

    const accountId = String(request["Account ID"] ?? "").trim();
    if (accountId) {
      expect(String(profile.uniqueId).trim()).toBe(accountId);
    }

    const ivrs = String(request["IVRS Number"] ?? "").trim();
    if (ivrs) {
      expect(String(profile.consumerNumber).trim()).toBe(ivrs);
      expect(String(profile.connectionDetails?.ivrsNo ?? "").trim()).toBe(ivrs);
    }

    const address = String(request["Address"] ?? "").trim();
    if (address) {
      expect(String(profile.permanentAddress).trim()).toBe(address);
      expect(String(profile.billingAddress).trim()).toBe(address);
    }

    const email = String(request["Email ID"] ?? "").trim();
    if (email && profile.consumerEmail != null) {
      expect(String(profile.consumerEmail).trim()).toBe(email);
    }

    if (profile.occupancyStatus != null) {
      expect(["Occupied", "Vacant"]).toContain(profile.occupancyStatus);
    }
    expect(profile.connectionDetails).toBeDefined();
    expect(profile.connectionMeterDetails).toBeDefined();
    expect(Array.isArray(profile.latestActivities)).toBeTruthy();
  }

  validatePostCreateProfileBackendRules(
    response: ConsumerProfileResponse,
    request: CreateConsumerRequestBody,
  ): void {
    this.validatePostCreateProfileExists(response);
    this.validatePostCreateProfilePersistence(response, request);
  }

  validateScenario(
    mapped: CreateConsumerMapped,
    scenario: CreateConsumerScenario,
    request: CreateConsumerRequestBody,
    validationField?: string,
  ): void {
    switch (scenario) {
      case "create_success":
        this.validateSuccessBackendRules(mapped, request);
        break;
      case "invalid_substation":
      case "invalid_feeder":
      case "invalid_dtr":
        this.validateErrorStructure(mapped);
        this.validateKnownErrorCode(mapped);
        break;
      case "missing_consumer_id":
      case "missing_nearest_acct_id":
      case "invalid_nearest_acct_id":
      case "invalid_bill_day":
      case "invalid_bill_day_zero":
      case "invalid_consumer_category":
      case "invalid_billing_cycle":
      case "invalid_connection_type":
      case "invalid_connection_status":
      case "invalid_tod":
      case "missing_msn":
      case "invalid_main_sub_meter":
      case "invalid_meter_phase":
      case "missing_service_point":
      case "reading_zero":
      case "missing_sim":
      case "invalid_imsi":
      case "invalid_meter_mobile":
      case "invalid_ip":
      case "missing_modem_serial":
        this.validateErrorBackendRules(mapped, validationField);
        break;
      case "consumer_id_exists":
        this.validateErrorStructure(mapped);
        this.validateKnownErrorCode(mapped);
        if (mapped.error?.code === "CONSUMER_CID_EXISTS") {
          this.validateDuplicateConsumer(mapped);
        } else {
          expect(
            (mapped.error?.message ?? "").toLowerCase(),
            "Expected duplicate Consumer ID rejection",
          ).toMatch(/consumer|exist|duplicate|already|cid/);
        }
        break;
      case "meter_not_found":
        this.validateErrorStructure(mapped);
        this.validateKnownErrorCode(mapped);
        this.validateMeterNotFound(mapped);
        break;
      case "meter_inactive":
        this.validateErrorStructure(mapped);
        this.validateKnownErrorCode(mapped);
        if (mapped.error?.code === "METER_INACTIVE") {
          this.validateMeterInactive(mapped);
        } else {
          this.validateMeterNotFound(mapped);
        }
        break;
      case "meter_already_mapped":
        this.validateErrorStructure(mapped);
        this.validateKnownErrorCode(mapped);
        if (mapped.error?.code === "METER_ALREADY_ASSIGNED") {
          this.validateMeterConflict(mapped);
        } else {
          expect(
            (mapped.error?.message ?? "").toLowerCase(),
            "Expected meter already mapped rejection",
          ).toMatch(/assigned|mapped|already|meter/);
        }
        break;
    }
  }
}
