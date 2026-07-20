import { expect } from "@playwright/test";
import {
  SearchConsumerData,
  SearchConsumerResponse,
} from "../Mapper/consumersearch.mapper";
export class SearchConsumerValidator {
  validateResponse(response: SearchConsumerResponse): void {
    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
  }
  validatePagination(data: SearchConsumerData): void {
    expect(data.page).toBeGreaterThan(0);
    expect(data.limit).toBeGreaterThan(0);
    expect(data.total).toBeGreaterThanOrEqual(data.items.length);
    expect(data.totalPages).toBeGreaterThan(0);
    const expectedPages = Math.max(1, Math.ceil(data.total / data.limit));
    expect(data.totalPages).toBe(expectedPages);
    expect(data.items.length).toBeLessThanOrEqual(data.limit);
  }
  validateItemsExist(data: SearchConsumerData): void {
    expect(data.items.length).toBeGreaterThan(0);
  }
  validateSerialSequence(data: SearchConsumerData): void {
    const offset = (data.page - 1) * data.limit;
    data.items.forEach((item, index) => {
      expect(item.slNo).toBe(offset + index + 1);
    });
  }
  validateRequiredFields(data: SearchConsumerData): void {
    data.items.forEach((item) => {
      expect(item.consumerCid?.trim()).not.toEqual("");
      expect(item.meterSerialNumber?.trim()).not.toEqual("");
      expect(typeof item.consumerName).toBe("string");
      expect(typeof item.consumerAddress).toBe("string");
      expect(typeof item.ivrsNo).toBe("string");
      expect(typeof item.existingIvrsNo).toBe("string");
      expect(typeof item.consumerMobileNumber).toBe("string");
    });
  }
  validateDataTypes(data: SearchConsumerData): void {
    data.items.forEach((item) => {
      expect(typeof item.slNo).toBe("number");
      expect(typeof item.consumerCid).toBe("string");
      expect(typeof item.consumerName).toBe("string");
      expect(typeof item.consumerAddress).toBe("string");
      expect(typeof item.meterSerialNumber).toBe("string");
      expect(typeof item.ivrsNo).toBe("string");
      expect(typeof item.existingIvrsNo).toBe("string");
      expect(typeof item.consumerMobileNumber).toBe("string");
      if (item.id !== undefined) {
        expect(typeof item.id).toBe("string");
      }
    });
  }
  validateDuplicateMeterSerials(data: SearchConsumerData): void {
    const serials = data.items.map((x) => x.meterSerialNumber?.trim());
    expect(serials.length).toBe(new Set(serials).size);
  }
  validateMobileNumberFormat(data: SearchConsumerData): void {
    data.items.forEach((item) => {
      const mobile = item.consumerMobileNumber?.trim() ?? "";
      if (mobile.length > 0) {
        expect(/^\d+$/.test(mobile)).toBeTruthy();
      }
    });
  }
  validateIvrsFields(data: SearchConsumerData): void {
    data.items.forEach((item) => {
      expect(typeof item.ivrsNo).toBe("string");
      expect(typeof item.existingIvrsNo).toBe("string");
    });
  }
  validateEmptyPage(data: SearchConsumerData): void {
    expect(data.items.length).toBe(0);
    expect(data.total).toBeGreaterThanOrEqual(0);
  }
  validateLimitOne(data: SearchConsumerData): void {
    expect(data.items.length).toBeLessThanOrEqual(1);
    if (data.total > 0) {
      expect(data.items.length).toBe(1);
    }
  }
}
