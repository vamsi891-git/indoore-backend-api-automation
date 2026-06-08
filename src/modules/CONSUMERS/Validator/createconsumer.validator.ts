import { expect } from "@playwright/test";
import { CreateConsumerRequestBody } from "../Data/createconsumer.data";
import {
    CREATE_SUCCESS_FIELDS,
    CreateConsumerMapped,
    CreateConsumerResponseData,
    REQUEST_ECHO_FIELDS,
} from "../Mapper/createconsumer.mapper";
import { ConsumerProfileResponse } from "../Mapper/consumerprofile.mapper";

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
    "Meter Phase",
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
    validateSuccessFlag(success: boolean) {
        expect(success).toBeTruthy();
    }

    validateCreateSuccess(mapped: CreateConsumerMapped) {
        expect(mapped.isCreateSuccess).toBeTruthy();
        expect(mapped.data).not.toBeNull();
    }

    validateSuccessMessage(
        mapped: CreateConsumerMapped,
        expectedMessage: string,
    ) {
        expect(mapped.message).toBe(expectedMessage);
    }

    validateRootStructure(mapped: CreateConsumerMapped) {
        expect(mapped.data).toBeDefined();
        expect(typeof mapped.data).toBe("object");
    }

    validateRequiredResponseFields(data: CreateConsumerResponseData) {
        CREATE_SUCCESS_FIELDS.forEach((field) => {
            expect(data).toHaveProperty(field);
            expect(data[field]).toBeTruthy();
        });
    }

    validateStringFields(data: CreateConsumerResponseData) {
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
            expect(typeof data[field]).toBe("string");
            expect(String(data[field]).trim().length).toBeGreaterThan(0);
        });
    }

    validateOptionalStringFields(data: CreateConsumerResponseData) {
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

    validateNumericFields(data: CreateConsumerResponseData) {
        NUMERIC_RESPONSE_FIELDS.forEach((field) => {
            if (data[field] == null) {
                return;
            }
            expect(typeof data[field]).toBe("number");
            expect(Number.isFinite(data[field] as number)).toBeTruthy();
        });
    }

    validateBooleanFields(data: CreateConsumerResponseData) {
        BOOLEAN_RESPONSE_FIELDS.forEach((field) => {
            if (data[field] == null) {
                return;
            }
            expect(typeof data[field]).toBe("boolean");
        });
    }

    validateLookupDisplayFields(data: CreateConsumerResponseData) {
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

    validateFormats(data: CreateConsumerResponseData) {
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

    validateNonNegativeLoads(data: CreateConsumerResponseData) {
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

    validateBillDay(data: CreateConsumerResponseData) {
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
    ) {
        REQUEST_ECHO_FIELDS.forEach(({ requestKey, responseKey }) => {
            const sent = request[requestKey];
            if (sent == null) {
                return;
            }
            expect(data).toHaveProperty(responseKey);
            expect(data[responseKey]).toBe(sent);
        });
    }

    validateLookupEcho(
        data: CreateConsumerResponseData,
        request: CreateConsumerRequestBody,
    ) {
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
                pattern: /commercial/i,
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

    validateBusinessRules(data: CreateConsumerResponseData) {
        expect(String(data["Consumer ID"]).trim().length).toBeGreaterThan(0);
        expect(String(data["Consumer Name"]).trim().length).toBeGreaterThan(0);
        expect(String(data["IVRS Number"]).trim().length).toBeGreaterThan(0);
        expect(String(data["Account ID"]).trim().length).toBeGreaterThan(0);
    }

    validateErrorStructure(mapped: CreateConsumerMapped) {
        expect(mapped.success).toBeFalsy();
        expect(mapped.error).not.toBeNull();
        expect(mapped.error!.code).toBeTruthy();
        expect(mapped.error!.message).toBeTruthy();
        expect(mapped.error!.code.trim().length).toBeGreaterThan(0);
        expect(mapped.error!.message.trim().length).toBeGreaterThan(0);
    }

    validateKnownErrorCode(mapped: CreateConsumerMapped) {
        if (!mapped.error?.code) {
            return;
        }
        expect(KNOWN_ERROR_CODES).toContain(mapped.error.code);
    }

    validateMeterConflict(mapped: CreateConsumerMapped) {
        if (mapped.error?.code !== "METER_ALREADY_ASSIGNED") {
            return;
        }
        expect(mapped.error.message.toLowerCase()).toContain("assigned");
    }

    validateMeterNotFound(mapped: CreateConsumerMapped) {
        if (mapped.error?.code !== "METER_NOT_FOUND") {
            return;
        }
        expect(mapped.error.message.toLowerCase()).toMatch(/meter|scope/);
    }

    validateDuplicateConsumer(mapped: CreateConsumerMapped) {
        if (mapped.error?.code !== "CONSUMER_CID_EXISTS") {
            return;
        }
        expect(mapped.error.message.toLowerCase()).toContain("consumer");
    }

    validateValidationError(mapped: CreateConsumerMapped) {
        if (mapped.error?.code !== "VALIDATION_ERROR") {
            return;
        }
        expect(mapped.error.message.toLowerCase()).toContain("invalid");
    }

    /**
     * When Consumer ID / IVRS / Account ID are freshly generated, a 409 should not
     * be a duplicate-consumer conflict — it is the meter (MSN) or scope issue.
     */
    validateConflictNotFromUniqueConsumerIds(
        mapped: CreateConsumerMapped,
        request: CreateConsumerRequestBody,
    ) {
        if (mapped.error?.code !== "CONSUMER_CID_EXISTS") {
            return;
        }
        const cid = String(request["Consumer ID"] ?? "");
        const ivrs = String(request["IVRS Number"] ?? "");
        const isAutoGenerated =
            cid.includes("AUTO-") &&
            ivrs.includes("AUTO-") &&
            cid !== ivrs;
        if (isAutoGenerated) {
            expect(
                mapped.error.code,
                "409 CONSUMER_CID_EXISTS with auto-generated IDs — reuse or fix payload, or meter may be misconfigured",
            ).not.toBe("CONSUMER_CID_EXISTS");
        }
    }

    validateExpectedErrorForMeterReason(
        mapped: CreateConsumerMapped,
        meterReason: string | null,
    ) {
        if (meterReason === "METER_ALREADY_ASSIGNED") {
            expect(mapped.error?.code).toBe("METER_ALREADY_ASSIGNED");
            return;
        }
        if (meterReason === "METER_NOT_FOUND") {
            expect(mapped.error?.code).toBe("METER_NOT_FOUND");
            return;
        }
        if (meterReason === "METER_INACTIVE") {
            expect(mapped.error?.code).toBeTruthy();
            return;
        }
        if (
            meterReason === "ORGANISATION_MISMATCH" ||
            meterReason === "OUT_OF_SCOPE" ||
            meterReason === "METER_WRONG_ZONE"
        ) {
            expect(mapped.error?.code).toBeTruthy();
        }
    }

    validateDataPresentBackendRules(
        mapped: CreateConsumerMapped,
        request: CreateConsumerRequestBody,
        expectedMessage: string,
    ) {
        this.validateCreateSuccess(mapped);
        this.validateSuccessMessage(mapped, expectedMessage);
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

    validatePostCreateConsumerNotFound(response: ConsumerProfileResponse) {
        expect(response.success).toBeFalsy();
        expect(response.error?.code).toBe("CONSUMER_NOT_FOUND");
    }

    validatePostCreateProfileExists(response: ConsumerProfileResponse) {
        expect(response.success).toBeTruthy();
        expect(response.data).toBeDefined();
    }

    validatePostCreateProfilePersistence(
        response: ConsumerProfileResponse,
        request: CreateConsumerRequestBody,
    ) {
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
            expect(String(profile.connectionDetails?.ivrsNo ?? "").trim()).toBe(
                ivrs,
            );
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

        expect(["Occupied", "Vacant"]).toContain(profile.occupancyStatus);
        expect(profile.connectionDetails).toBeDefined();
        expect(profile.connectionMeterDetails).toBeDefined();
        expect(Array.isArray(profile.latestActivities)).toBeTruthy();
    }

    validatePostCreateProfileBackendRules(
        response: ConsumerProfileResponse,
        request: CreateConsumerRequestBody,
    ) {
        this.validatePostCreateProfileExists(response);
        this.validatePostCreateProfilePersistence(response, request);
    }

    validateConflictBackendRules(
        mapped: CreateConsumerMapped,
        meterReason: string | null,
        request?: CreateConsumerRequestBody,
    ) {
        this.validateErrorStructure(mapped);
        this.validateKnownErrorCode(mapped);
        this.validateMeterConflict(mapped);
        this.validateMeterNotFound(mapped);
        this.validateDuplicateConsumer(mapped);
        this.validateValidationError(mapped);
        if (request) {
            this.validateConflictNotFromUniqueConsumerIds(mapped, request);
        }
        if (meterReason) {
            this.validateExpectedErrorForMeterReason(mapped, meterReason);
        }
    }
}
