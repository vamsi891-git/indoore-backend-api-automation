import { expect } from "@playwright/test";
import {
  SearchConsumerData,
  SearchConsumerResponse,
} from "../Mapper/consumersearch.mapper";

export class SearchConsumerValidator {

  validateResponse(
    response: SearchConsumerResponse
  ): void {
    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
  }

  validatePagination(
    data: SearchConsumerData
  ): void {

    expect(data.page).toBeGreaterThan(0);
    expect(data.limit).toBeGreaterThan(0);

    expect(data.total).toBeGreaterThanOrEqual(
      data.items.length
    );

    expect(data.totalPages).toBeGreaterThan(0);

    const expectedPages = Math.ceil(
      data.total / data.limit
    );

    expect(data.totalPages).toBe(
      expectedPages
    );

    expect(data.items.length)
      .toBeLessThanOrEqual(data.limit);
  }

  validateItemsExist(
    data: SearchConsumerData
  ): void {
    expect(data.items.length)
      .toBeGreaterThan(0);
  }

  validateSerialSequence(
    data: SearchConsumerData
  ): void {

    data.items.forEach((item, index) => {
      expect(item.slNo)
        .toBe(index + 1);
    });
  }

  validateRequiredFields(
    data: SearchConsumerData
  ): void {

    data.items.forEach(item => {

      expect(item.consumerCid)
        .toBeTruthy();

      expect(item.ivrsNo)
        .toBeTruthy();

      expect(item.meterSerialNumber)
        .toBeTruthy();

      expect(item.meterLookupTblRefId)
        .toBeGreaterThan(0);

      expect(item.category)
        .toBeTruthy();

      expect(item.installationDate)
        .toBeTruthy();
    });
  }

  validateDataTypes(
    data: SearchConsumerData
  ): void {

    data.items.forEach(item => {

      expect(typeof item.slNo)
        .toBe("number");

      expect(typeof item.consumerCid)
        .toBe("string");

      expect(typeof item.meterSerialNumber)
        .toBe("string");

      expect(typeof item.category)
        .toBe("string");

      expect(typeof item.meterLookupTblRefId)
        .toBe("number");

      expect(typeof item.sanctionedLoadKw)
        .toBe("number");

      expect(typeof item.mf)
        .toBe("number");
    });
  }

  validateDuplicateMeterLookupIds(
    data: SearchConsumerData
  ): void {

    const ids = data.items.map(
      x => x.meterLookupTblRefId
    );

    expect(ids.length)
      .toBe(new Set(ids).size);
  }

  validateMeterPhase(
    data: SearchConsumerData
  ): void {

    const validPhases = [
      "1 PH",
      "3PH WC",
      "HT"
    ];

    data.items.forEach(item => {
      expect(validPhases)
        .toContain(item.meterPhase);
    });
  }

  validateCoordinates(
    data: SearchConsumerData
  ): void {

    data.items.forEach(item => {

      if (item.latitude !== null) {

        const lat = Number(item.latitude);

        expect(lat)
          .toBeGreaterThanOrEqual(-90);

        expect(lat)
          .toBeLessThanOrEqual(90);
      }

      if (item.longitude !== null) {

        const lng = Number(item.longitude);

        expect(lng)
          .toBeGreaterThanOrEqual(-180);

        expect(lng)
          .toBeLessThanOrEqual(180);
      }
    });
  }

  validateLoadValues(
    data: SearchConsumerData
  ): void {

    data.items.forEach(item => {

      expect(item.sanctionedLoadKw)
        .toBeGreaterThan(0);

      expect(item.mf)
        .toBeGreaterThan(0);
    });
  }

  validateIvrsConsistency(
    data: SearchConsumerData
  ): void {

    data.items.forEach(item => {

      expect(item.ivrsNo)
        .toBeTruthy();

      expect(item.existingIvrsNo)
        .toBeTruthy();
    });
  }

  validateInstallationDate(
    data: SearchConsumerData
  ): void {

    data.items.forEach(item => {

      const date =
        new Date(item.installationDate);

      expect(
        isNaN(date.getTime())
      ).toBeFalsy();
    });
  }
}