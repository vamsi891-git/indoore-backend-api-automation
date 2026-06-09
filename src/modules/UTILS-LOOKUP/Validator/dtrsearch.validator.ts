import { expect } from "@playwright/test";
import {
  DtrSearchData,
  DtrSearchResponse,
} from "../Mapper/dtrsearch.mapper";

export class DtrSearchValidator {

  validateResponse(
    response: DtrSearchResponse
  ): void {

    expect(response.success).toBe(true);

    expect(response.data).toBeDefined();
  }

  validatePagination(
    data: DtrSearchData
  ): void {

    expect(data.page).toBeGreaterThan(0);

    expect(data.limit).toBeGreaterThan(0);

    expect(data.total).toBeGreaterThanOrEqual(0);

    expect(data.totalPages).toBeGreaterThanOrEqual(0);

    expect(data.totalPages).toBe(
      Math.ceil(data.total / data.limit)
    );
  }

  validateItemsExist(
    data: DtrSearchData
  ): void {

    if (data.total > 0) {
      expect(data.item.length).toBeGreaterThan(0);
    } else {
      expect(data.item.length).toBe(0);
    }
  }

  validateSerialNumbers(
    data: DtrSearchData
  ): void {

    data.item.forEach((item, index) => {

      expect(item.slNo)
        .toBe(index + 1);
    });
  }

  validateRequiredFields(
    data: DtrSearchData
  ): void {

    data.item.forEach(item => {

      expect(item.dtrCode)
        .toBeTruthy();

      expect(item.code)
        .toBeTruthy();

      expect(item.dtrName)
        .toBeTruthy();

      expect(item.dtr)
        .toBeTruthy();
    });
  }

  validateDataTypes(
    data: DtrSearchData
  ): void {

    data.item.forEach(item => {

      expect(typeof item.slNo)
        .toBe("number");

      expect(typeof item.dtrCode)
        .toBe("string");

      expect(typeof item.code)
        .toBe("string");

      expect(typeof item.dtrName)
        .toBe("string");

      expect(typeof item.dtr)
        .toBe("string");
    });
  }

  validateMeterSerialNumbers(
    data: DtrSearchData
  ): void {

    data.item.forEach(item => {

      if (item.meterSerialNumber !== null) {

        expect(
          item.meterSerialNumber.length
        ).toBeGreaterThan(0);
      }
    });
  }

  validateDuplicateMeterSerials(
    data: DtrSearchData
  ): void {

    const serials = data.item
      .filter(x => x.meterSerialNumber)
      .map(x => x.meterSerialNumber);

    expect(serials.length)
      .toBe(new Set(serials).size);
  }

  validateCoordinates(
    data: DtrSearchData
  ): void {

    data.item.forEach(item => {

      if (item.latitude !== null) {

        const lat =
          Number(item.latitude);

        expect(lat)
          .toBeGreaterThanOrEqual(-90);

        expect(lat)
          .toBeLessThanOrEqual(90);
      }

      if (item.longitude !== null) {

        const lng =
          Number(item.longitude);

        expect(lng)
          .toBeGreaterThanOrEqual(-180);

        expect(lng)
          .toBeLessThanOrEqual(180);
      }
    });
  }

  validateMF(
    data: DtrSearchData
  ): void {

    data.item.forEach(item => {

      if (item.mf !== null) {

        expect(
          Number(item.mf)
        ).toBeGreaterThan(0);
      }
    });
  }

  validateBusinessRules(
    data: DtrSearchData
  ): void {

    data.item.forEach(item => {

      expect(item.dtrCode)
        .toEqual(item.code);

      expect(item.dtrName.trim())
        .not.toEqual("");
    });
  }

  validatePageAggregation(
    data: DtrSearchData
  ): void {

    expect(data.item.length)
      .toBeLessThanOrEqual(data.limit);

    expect(data.total)
      .toBeGreaterThanOrEqual(
        data.item.length
      );
  }
}