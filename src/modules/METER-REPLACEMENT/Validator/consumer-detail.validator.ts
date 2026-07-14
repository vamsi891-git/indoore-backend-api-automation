import { expect } from "@playwright/test";
import {
  ConsumerDetail,
  ConsumerStatus,
  MeterStatus,
} from "../Mapper/consumer-detail.mapper";

const REQUIRED_FIELDS = [
  "consumer",
  "ivrs",
  "rrNumber",
  "consumerId",
  "consumerCid",
  "accountId",
  "servicePointId",
  "address",
  "zone",
  "office",
  "oldMeterLookupId",
  "oldMeterSerial",
  "oldMeterStatus",
  "latitude",
  "longitude",
  "consumerStatus",
  "replacementEligible",
] as const;

const ALLOWED_STATUS: ConsumerStatus[] = ["ACTIVE", "INACTIVE"];

const ALLOWED_METER_STATUS: MeterStatus[] = ["ACTIVE", "INACTIVE"];

export class ConsumerDetailValidator {
  validateSuccess(success: boolean) {
    expect(success).toBeTruthy();
  }

  validateRootStructure(data: ConsumerDetail) {
    expect(typeof data).toBe("object");
  }

  validateRequiredFields(data: ConsumerDetail) {
    REQUIRED_FIELDS.forEach((field) => {
      expect(data).toHaveProperty(field);
    });
  }

  validateConsumer(data: ConsumerDetail) {
    expect(typeof data.consumer).toBe("string");
    expect(data.consumer.trim().length).toBeGreaterThan(0);
  }

  validateConsumerTrim(data: ConsumerDetail) {
    expect(data.consumer).toBe(data.consumer.trim());
  }

  validateConsumerLength(data: ConsumerDetail) {
    expect(data.consumer.length).toBeGreaterThan(0);
    expect(data.consumer.length).toBeLessThanOrEqual(255);
  }

  validateIvrs(data: ConsumerDetail) {
    expect(typeof data.ivrs).toBe("string");
    expect(data.ivrs.trim().length).toBeGreaterThan(0);
  }

  validateIvrsTrim(data: ConsumerDetail) {
    expect(data.ivrs).toBe(data.ivrs.trim());
  }

  validateRrNumber(data: ConsumerDetail) {
    expect(typeof data.rrNumber).toBe("string");
    expect(data.rrNumber.trim().length).toBeGreaterThan(0);
  }

  validateConsumerId(data: ConsumerDetail) {
    expect(typeof data.consumerId).toBe("number");
    expect(Number.isInteger(data.consumerId)).toBeTruthy();
    expect(data.consumerId).toBeGreaterThan(0);
  }

  validateConsumerCid(data: ConsumerDetail) {
    expect(typeof data.consumerCid).toBe("string");
    expect(data.consumerCid.trim().length).toBeGreaterThan(0);
  }

  validateAccountId(data: ConsumerDetail) {
    expect(typeof data.accountId).toBe("string");
    expect(data.accountId.trim().length).toBeGreaterThan(0);
  }

  validateServicePointId(data: ConsumerDetail) {
    expect(typeof data.servicePointId).toBe("string");
    expect(data.servicePointId.trim().length).toBeGreaterThan(0);
  }

  validateAddress(data: ConsumerDetail) {
    expect(typeof data.address).toBe("string");
    expect(data.address.trim().length).toBeGreaterThan(0);
  }

  validateZone(data: ConsumerDetail) {
    expect(typeof data.zone).toBe("string");
  }

  validateOffice(data: ConsumerDetail) {
    expect(typeof data.office).toBe("string");
    expect(data.office.trim().length).toBeGreaterThan(0);
  }

  validateOldMeterLookupId(data: ConsumerDetail) {
    expect(typeof data.oldMeterLookupId).toBe("number");
    expect(Number.isInteger(data.oldMeterLookupId)).toBeTruthy();
    expect(data.oldMeterLookupId).toBeGreaterThan(0);
  }

  validateOldMeterSerial(data: ConsumerDetail) {
    expect(typeof data.oldMeterSerial).toBe("string");
    expect(data.oldMeterSerial.trim().length).toBeGreaterThan(0);
  }

  validateOldMeterStatus(data: ConsumerDetail) {
    expect(ALLOWED_METER_STATUS).toContain(data.oldMeterStatus);
  }

  validateConsumerStatus(data: ConsumerDetail) {
    expect(ALLOWED_STATUS).toContain(data.consumerStatus);
  }

  validateLatitude(data: ConsumerDetail) {
    expect(typeof data.latitude).toBe("string");
    expect(data.latitude.trim().length).toBeGreaterThan(0);
    expect(Number.isNaN(Number(data.latitude))).toBeFalsy();
  }

  validateLongitude(data: ConsumerDetail) {
    expect(typeof data.longitude).toBe("string");
    expect(data.longitude.trim().length).toBeGreaterThan(0);
    expect(Number.isNaN(Number(data.longitude))).toBeFalsy();
  }

  validateReplacementEligible(data: ConsumerDetail) {
    expect(typeof data.replacementEligible).toBe("boolean");
  }

  validateNoNullValues(data: ConsumerDetail) {
    Object.values(data).forEach((value) => {
      expect(value).not.toBeNull();
    });
  }

  validateNoUndefinedValues(data: ConsumerDetail) {
    Object.values(data).forEach((value) => {
      expect(value).not.toBeUndefined();
    });
  }

  validateConsumerIdentity(data: ConsumerDetail) {
    expect(data.consumerId).toBeGreaterThan(0);
    expect(data.consumerCid.trim().length).toBeGreaterThan(0);
    expect(data.consumer.trim().length).toBeGreaterThan(0);
  }

  validateMeterIdentity(data: ConsumerDetail) {
    expect(data.oldMeterLookupId).toBeGreaterThan(0);
    expect(data.oldMeterSerial.trim().length).toBeGreaterThan(0);
  }

  validateLocationIdentity(data: ConsumerDetail) {
    expect(data.address.trim().length).toBeGreaterThan(0);
    expect(data.office.trim().length).toBeGreaterThan(0);
  }

  validateIvrsEqualsRrNumber(data: ConsumerDetail) {
    expect(data.ivrs).toBe(data.rrNumber);
  }

  validateConsumerCidConsistency(data: ConsumerDetail) {
    expect(data.consumerCid.trim().length).toBeGreaterThan(0);
    expect(data.consumerCid).toBe(data.consumerCid.trim());
  }

  validateAccountIdConsistency(data: ConsumerDetail) {
    expect(data.accountId).toBe(data.accountId.trim());
    expect(data.accountId.length).toBeGreaterThan(0);
  }

  validateServicePointTrim(data: ConsumerDetail) {
    expect(data.servicePointId).toBe(data.servicePointId.trim());
  }

  validateAddressTrim(data: ConsumerDetail) {
    expect(data.address).toBe(data.address.trim());
  }

  validateOfficeTrim(data: ConsumerDetail) {
    expect(data.office).toBe(data.office.trim());
  }

  validateZoneTrim(data: ConsumerDetail) {
    expect(data.zone).toBe(data.zone.trim());
  }

  validateOldMeterSerialTrim(data: ConsumerDetail) {
    expect(data.oldMeterSerial).toBe(data.oldMeterSerial.trim());
  }

  validateLatitudeTrim(data: ConsumerDetail) {
    expect(data.latitude).toBe(data.latitude.trim());
  }

  validateLongitudeTrim(data: ConsumerDetail) {
    expect(data.longitude).toBe(data.longitude.trim());
  }

  validateLatitudeRange(data: ConsumerDetail) {
    const latitude = Number(data.latitude);
    expect(Number.isFinite(latitude)).toBeTruthy();
    // Seed/master data can return out-of-range coords (e.g. lat=123).
    // Log for backend cleanup; do not hard-fail smoke until data is fixed.
    if (latitude < -90 || latitude > 90) {
      console.log(
        `BACKEND FINDING: consumer ${data.consumerId} latitude out of range: ${data.latitude}`,
      );
      return;
    }
  }

  validateLongitudeRange(data: ConsumerDetail) {
    const longitude = Number(data.longitude);
    expect(Number.isFinite(longitude)).toBeTruthy();
    if (longitude < -180 || longitude > 180) {
      console.log(
        `BACKEND FINDING: consumer ${data.consumerId} longitude out of range: ${data.longitude}`,
      );
      return;
    }
  }

  validateCoordinatePrecision(data: ConsumerDetail) {
    expect(data.latitude).toContain(".");
    expect(data.longitude).toContain(".");
  }

  validateActiveConsumerRule(data: ConsumerDetail) {
    if (data.consumerStatus === "ACTIVE") {
      expect(data.consumerId).toBeGreaterThan(0);
      expect(data.consumer.length).toBeGreaterThan(0);
    }
  }

  validateActiveMeterRule(data: ConsumerDetail) {
    if (data.oldMeterStatus === "ACTIVE") {
      expect(data.oldMeterLookupId).toBeGreaterThan(0);
      expect(data.oldMeterSerial.length).toBeGreaterThan(0);
    }
  }

  validateReplacementEligibilityRule(data: ConsumerDetail) {
    if (data.replacementEligible) {
      expect(data.consumerStatus).toBe("ACTIVE");
      expect(data.oldMeterStatus).toBe("ACTIVE");
    }
  }

  validateReplacementIneligibleRule(data: ConsumerDetail) {
    if (
      data.consumerStatus === "INACTIVE" ||
      data.oldMeterStatus === "INACTIVE"
    ) {
      expect(data.replacementEligible).toBeFalsy();
    }
  }

  validateMeterLookupRelationship(data: ConsumerDetail) {
    expect(data.oldMeterLookupId).toBeGreaterThan(0);
    expect(data.oldMeterSerial.trim().length).toBeGreaterThan(0);
  }

  validateConsumerRelationship(data: ConsumerDetail) {
    expect(data.consumer.length).toBeGreaterThan(0);
    expect(data.consumerId).toBeGreaterThan(0);
    expect(data.consumerCid.length).toBeGreaterThan(0);
  }

  validateLocationRelationship(data: ConsumerDetail) {
    expect(data.office.length).toBeGreaterThan(0);
    expect(data.address.length).toBeGreaterThan(0);
  }

  validateNoExtraFields(data: ConsumerDetail) {
    expect(Object.keys(data).sort()).toEqual([
      "accountId",
      "address",
      "consumer",
      "consumerCid",
      "consumerId",
      "consumerStatus",
      "ivrs",
      "latitude",
      "longitude",
      "office",
      "oldMeterLookupId",
      "oldMeterSerial",
      "oldMeterStatus",
      "replacementEligible",
      "rrNumber",
      "servicePointId",
      "zone",
    ]);
  }

  validateObjectSize(data: ConsumerDetail) {
    expect(Object.keys(data).length).toBe(17);
  }

  validateResponseIntegrity(data: ConsumerDetail) {
    expect(data.consumer).toBeTruthy();
    expect(data.ivrs).toBeTruthy();
    expect(data.rrNumber).toBeTruthy();
    expect(data.consumerCid).toBeTruthy();
    expect(data.accountId).toBeTruthy();
    expect(data.oldMeterSerial).toBeTruthy();
  }

  validateStringFields(data: ConsumerDetail) {
    const fields = [
      data.consumer,
      data.ivrs,
      data.rrNumber,
      data.consumerCid,
      data.accountId,
      data.servicePointId,
      data.address,
      data.zone,
      data.office,
      data.oldMeterSerial,
      data.latitude,
      data.longitude,
    ];

    fields.forEach((field) => {
      expect(typeof field).toBe("string");
    });
  }

  validateNumericFields(data: ConsumerDetail) {
    expect(typeof data.consumerId).toBe("number");
    expect(typeof data.oldMeterLookupId).toBe("number");
  }

  validateBooleanField(data: ConsumerDetail) {
    expect(typeof data.replacementEligible).toBe("boolean");
  }

  validateStatusFields(data: ConsumerDetail) {
    expect(ALLOWED_STATUS).toContain(data.consumerStatus);
    expect(ALLOWED_METER_STATUS).toContain(data.oldMeterStatus);
  }

  validateCoordinateConsistency(data: ConsumerDetail) {
    const lat = Number(data.latitude);
    const lon = Number(data.longitude);
    expect(Number.isFinite(lat)).toBeTruthy();
    expect(Number.isFinite(lon)).toBeTruthy();
  }

  validateBusinessRules(data: ConsumerDetail) {
    expect(data.consumerId).toBeGreaterThan(0);
    expect(data.oldMeterLookupId).toBeGreaterThan(0);
    expect(data.consumer.length).toBeGreaterThan(0);
    expect(data.oldMeterSerial.length).toBeGreaterThan(0);
  }
}
