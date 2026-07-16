import { expect } from "@playwright/test";
import {
  SubmissionDetailData,
  SubmissionConsumer,
  SubmissionMeter,
  SubmissionStatus,
  ConsumerStatus,
  MeterStatus,
} from "../Mapper/submission-detail.mapper";
const ALLOWED_SUBMISSION_STATUS: SubmissionStatus[] = [
  "PENDING",
  "COMPLETED",
];
const ALLOWED_CONSUMER_STATUS: ConsumerStatus[] = [
  "ACTIVE",
  "INACTIVE",
];
const ALLOWED_METER_STATUS: MeterStatus[] = [
  "ACTIVE",
  "INACTIVE",
  "UNKNOWN",
];
const ROOT_REQUIRED_FIELDS = [
  "id",
  "status",
  "createdDate",
  "completedDate",
  "consumer",
  "oldMeter",
  "newMeter",
  "replacementReason",
  "remarks",
  "latitude",
  "longitude",
  "submittedBy",
] as const;
const CONSUMER_REQUIRED_FIELDS = [
  "consumerId",
  "consumerCid",
  "consumerName",
  "ivrs",
  "rrNumber",
  "accountId",
  "servicePointId",
  "address",
  "zone",
  "office",
  "consumerStatus",
] as const;
const METER_REQUIRED_FIELDS = [
  "meterLookupId",
  "meterSerial",
  "meterReading",
  "meterStatus",
] as const;
const DATE_PATTERN = /^\d{1,2}\s[A-Za-z]{3}\s\d{4},\s\d{1,2}:\d{2}\s(am|pm)$/i;
export class SubmissionDetailValidator {
  validateSuccess(success: boolean) {
    expect(success).toBeTruthy();
  }
  validateRootStructure(data: SubmissionDetailData) {
    expect(typeof data).toBe("object");
  }
  validateRequiredFields(data: SubmissionDetailData) {
    ROOT_REQUIRED_FIELDS.forEach((field) => {
      expect(data).toHaveProperty(field);
    });
  }
  validateSubmissionId(data: SubmissionDetailData) {
    expect(typeof data.id).toBe("number");
    expect(Number.isInteger(data.id)).toBeTruthy();
    expect(data.id).toBeGreaterThan(0);
  }
  validateSubmissionStatus(data: SubmissionDetailData) {
    expect(ALLOWED_SUBMISSION_STATUS).toContain(data.status,);
  }
  validateCreatedDate(data: SubmissionDetailData) {
    expect(data.createdDate.length).toBeGreaterThan(0);
    expect(DATE_PATTERN.test(data.createdDate),).toBeTruthy();
  }
  validateCompletedDate(data: SubmissionDetailData) {
    if (data.completedDate === null) {
      return;
    }
    expect(DATE_PATTERN.test(data.completedDate),).toBeTruthy();
  }
  validateConsumerObject(consumer: SubmissionConsumer,) {
    expect(typeof consumer).toBe("object");
  }
  validateConsumerRequiredFields(consumer: SubmissionConsumer,) {
    CONSUMER_REQUIRED_FIELDS.forEach((field) => {
      expect(consumer).toHaveProperty(field);
    });
  }
  validateConsumerId(consumer: SubmissionConsumer,) {
    expect(typeof consumer.consumerId).toBe("number");
    expect(consumer.consumerId,).toBeGreaterThan(0);
  }
  validateConsumerName(consumer: SubmissionConsumer,) {
    expect(consumer.consumerName.trim().length,).toBeGreaterThan(0);
  }
  validateConsumerStatus(consumer: SubmissionConsumer,) {
    expect(ALLOWED_CONSUMER_STATUS,).toContain(consumer.consumerStatus,);
  }
  validateConsumerIdentity(consumer: SubmissionConsumer,) {
    expect(consumer.consumerCid.length,).toBeGreaterThan(0);
    expect(consumer.accountId.length,).toBeGreaterThan(0);
    expect(consumer.servicePointId.length,).toBeGreaterThan(0);
  }
  validateOldMeterObject(meter: SubmissionMeter,) {
    expect(typeof meter).toBe("object");
  }
  validateOldMeterRequiredFields(meter: SubmissionMeter,) {
    METER_REQUIRED_FIELDS.forEach((field) => {
      expect(meter).toHaveProperty(field);
    });
  }
  validateOldMeterLookupId(meter: SubmissionMeter,) {
    expect(typeof meter.meterLookupId,).toBe("number");
    expect(meter.meterLookupId!,).toBeGreaterThan(0);
  }
  validateOldMeterSerial(meter: SubmissionMeter,) {
    expect(meter.meterSerial.trim().length,).toBeGreaterThan(0);
  }
  validateOldMeterStatus( meter: SubmissionMeter,) {
    expect(ALLOWED_METER_STATUS,).toContain(meter.meterStatus,);
  }
  validateNewMeterObject(meter: SubmissionMeter,) {
    expect(typeof meter).toBe("object");
  }
  validateNewMeterRequiredFields(meter: SubmissionMeter,) {
    METER_REQUIRED_FIELDS.forEach((field) => {
      expect(meter).toHaveProperty(field);
    });
  }
  validateNewMeterLookupId(meter: SubmissionMeter,) {
    expect(typeof meter.meterLookupId,).toBe("number");
    expect(meter.meterLookupId!,).toBeGreaterThan(0);
  }
  validateNewMeterSerial(meter: SubmissionMeter,) {
    expect(meter.meterSerial.trim().length,).toBeGreaterThan(0);
  }
  validateNewMeterStatus(meter: SubmissionMeter,) {
    expect(ALLOWED_METER_STATUS,).toContain(meter.meterStatus,);
  }
  validateSubmittedBy(data: SubmissionDetailData,) {
    expect(data.submittedBy.trim().length,).toBeGreaterThan(0);
  }
  validateCoordinates(data: SubmissionDetailData,) {
    if (data.latitude != null) {
      expect(Number.isNaN(Number(data.latitude),),).toBeFalsy();
    }
    if (data.longitude != null) {
      expect(Number.isNaN(Number(data.longitude),),).toBeFalsy();
    }
  }
  validateNoNullCriticalFields(data: SubmissionDetailData,) {
    expect(data.id).not.toBeNull();
    expect(data.status).not.toBeNull();
    expect(data.consumer).not.toBeNull();
    expect(data.oldMeter).not.toBeNull();
    expect(data.newMeter).not.toBeNull();
    expect(data.submittedBy).not.toBeNull();
  }
  validateBusinessRules(data: SubmissionDetailData,) {
    expect(data).toHaveProperty("consumer");
    expect(data).toHaveProperty("oldMeter");
    expect(data).toHaveProperty("newMeter");
  }
  validateConsumerTrim(consumer: SubmissionConsumer,) {
    expect(consumer.consumerCid).toBe(consumer.consumerCid.trim(),);
    expect(consumer.consumerName).toBe(consumer.consumerName.trim(),);
    expect(consumer.ivrs).toBe(consumer.ivrs.trim(),);
    expect(consumer.rrNumber).toBe(consumer.rrNumber.trim(),);
    expect(consumer.accountId).toBe(consumer.accountId.trim(),);
    expect(consumer.servicePointId).toBe(consumer.servicePointId.trim(),);
    expect(consumer.address).toBe(consumer.address.trim(),);
    expect(consumer.zone).toBe(consumer.zone.trim(),);
    expect(consumer.office).toBe(consumer.office.trim(),);
  }
  validateOldMeterTrim(meter: SubmissionMeter,) {
    expect(meter.meterSerial).toBe(meter.meterSerial.trim(),);
    if (meter.meterReading != null) {
      expect(meter.meterReading).toBe(meter.meterReading.trim(),
      );
    }
  }
  validateNewMeterTrim(meter: SubmissionMeter,) {
    expect(meter.meterSerial).toBe(meter.meterSerial.trim());
    if (meter.meterReading != null) {
      expect(meter.meterReading).toBe(meter.meterReading.trim(),);
    }
  }
  validateReplacementReason(data: SubmissionDetailData,) {
    if (data.replacementReason == null) {
      return;
    }
    expect(data.replacementReason.trim().length,).toBeGreaterThan(0);
  }
  validateRemarks(data: SubmissionDetailData,) {
    if (data.remarks == null) {
      return;
    }
    expect(data.remarks,).toBe(data.remarks.trim(),);
  }
  validateCoordinateRange(data: SubmissionDetailData,) {
    if (data.latitude != null) {
      const lat = Number(data.latitude);
      expect(lat).toBeGreaterThanOrEqual(-90);
      expect(lat).toBeLessThanOrEqual(90);
    }
    if (data.longitude != null) {
      const lon = Number(data.longitude);
      expect(lon).toBeGreaterThanOrEqual(-180);
      expect(lon).toBeLessThanOrEqual(180);
    }
  }
  validateCoordinatePrecision(data: SubmissionDetailData,) {
    if (data.latitude != null) {
      expect(data.latitude).toContain(".");
    }
    if (data.longitude != null) {
      expect(data.longitude).toContain(".");
    }
  }
  validateSubmittedByTrim(data: SubmissionDetailData, ) {
    expect(data.submittedBy).toBe(data.submittedBy.trim(),);
  }

  validateOldAndNewMetersDifferent(
    data: SubmissionDetailData,
  ) {

    expect(
      data.oldMeter.meterSerial,
    ).not.toBe(
      data.newMeter.meterSerial,
    );

    expect(
      data.oldMeter.meterLookupId,
    ).not.toBe(
      data.newMeter.meterLookupId,
    );

  }

  validateConsumerIvrsConsistency(
    consumer: SubmissionConsumer,
  ) {
    expect(
      consumer.ivrs,
    ).toBe(
      consumer.rrNumber,
    );
  }

  validateReadingFormat(
    meter: SubmissionMeter,
  ) {

    if (meter.meterReading == null) {
      return;
    }

    expect(
      Number.isNaN(
        Number(meter.meterReading),
      ),
    ).toBeFalsy();

  }

  validateMeterLookupRelationship(
    oldMeter: SubmissionMeter,
    newMeter: SubmissionMeter,
  ) {

    expect(
      oldMeter.meterLookupId,
    ).toBeGreaterThan(0);

    expect(
      newMeter.meterLookupId,
    ).toBeGreaterThan(0);

  }

  validateResponseIntegrity(
    data: SubmissionDetailData,
  ) {

    expect(data.id).toBeTruthy();

    expect(data.status).toBeTruthy();

    expect(data.consumer.consumerName).toBeTruthy();

    expect(data.oldMeter.meterSerial).toBeTruthy();

    expect(data.newMeter.meterSerial).toBeTruthy();

    expect(data.submittedBy).toBeTruthy();

  }

  validateNoUndefinedCriticalFields(
    data: SubmissionDetailData,
  ) {

    expect(data.id).not.toBeUndefined();

    expect(data.consumer).not.toBeUndefined();

    expect(data.oldMeter).not.toBeUndefined();

    expect(data.newMeter).not.toBeUndefined();

    expect(data.submittedBy).not.toBeUndefined();

  }

  validateObjectSize(
    data: SubmissionDetailData & { success?: boolean },
  ) {

    expect(
      Object.keys(data).length,
    ).toBe(13);

  }

  validateConsumerObjectSize(
    consumer: SubmissionConsumer,
  ) {

    expect(
      Object.keys(consumer).length,
    ).toBe(11);

  }

  validateMeterObjectSize(
    meter: SubmissionMeter,
  ) {

    expect(
      Object.keys(meter).length,
    ).toBe(4);

  }

  validateNoExtraRootFields(
    data: SubmissionDetailData & { success?: boolean },
  ) {

    expect(
      Object.keys(data).sort(),
    ).toEqual([
      "completedDate",
      "consumer",
      "createdDate",
      "id",
      "latitude",
      "longitude",
      "newMeter",
      "oldMeter",
      "remarks",
      "replacementReason",
      "status",
      "submittedBy",
      "success",
    ]);

  }

  validateConsumerStatusBusinessRule(
    consumer: SubmissionConsumer,
  ) {

    if (
      consumer.consumerStatus === "ACTIVE"
    ) {

      expect(
        consumer.consumerId,
      ).toBeGreaterThan(0);

    }

  }

  validateMeterStatusBusinessRule(
    meter: SubmissionMeter,
  ) {

    if (
      meter.meterStatus === "ACTIVE"
    ) {

      expect(
        meter.meterLookupId,
      ).toBeGreaterThan(0);

      expect(
        meter.meterSerial.length,
      ).toBeGreaterThan(0);

    }

  }

  validateCompletedSubmissionRule(
    data: SubmissionDetailData,
  ) {

    if (
      data.status === "COMPLETED"
    ) {

      expect(
        data.completedDate,
      ).not.toBeNull();

    }

  }

  validatePendingSubmissionRule(
    data: SubmissionDetailData,
  ) {

    if (
      data.status === "PENDING"
    ) {

      expect(
        data.createdDate.length,
      ).toBeGreaterThan(0);

    }

  }

  validateSubmittedByLength(
    data: SubmissionDetailData,
  ) {

    expect(
      data.submittedBy.length,
    ).toBeLessThanOrEqual(255);

  }

  validateConsumerNameLength(
    consumer: SubmissionConsumer,
  ) {

    expect(
      consumer.consumerName.length,
    ).toBeLessThanOrEqual(255);

  }

  validateMeterSerialLength(
    meter: SubmissionMeter,
  ) {

    expect(
      meter.meterSerial.length,
    ).toBeLessThanOrEqual(100);

  }

}