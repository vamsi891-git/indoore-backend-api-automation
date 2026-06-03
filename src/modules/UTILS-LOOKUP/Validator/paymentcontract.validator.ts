// Validator/paymentcontract.validator.ts
import { expect } from "@playwright/test";
import { PaymentContractData,PaymentContractResponse,} from "../Mapper/paymentcontract.mapper";
export class PaymentContractValidator {
  validateResponse(response: PaymentContractResponse) {
    expect(response.success).toBeTruthy();
  }
  validateItemsExist(data: PaymentContractData) {
    expect(data.items.length).toBeGreaterThan(0);
  }
  validateFields(data: PaymentContractData) {
    data.items.forEach((item) => {
      expect(item.id).toBeGreaterThan(0);
      expect(item.name).toBeTruthy();
      expect(item.name.trim()).not.toEqual("");
      if (item.code !== null) {
        expect(item.code.trim()).not.toEqual("");
      }
    });
  }
  validateDuplicateIds(data: PaymentContractData) {
    const ids = data.items.map((x) => x.id);
    const unique = new Set(ids);
    expect(ids.length).toBe(unique.size);
  }
  validateDuplicateNames(data: PaymentContractData) {
    const names = data.items.map((x) => x.name);
    const unique = new Set(names);
    expect(names.length).toBe(unique.size);
  }
  validateDuplicateCodes(data: PaymentContractData) {
    const codes = data.items.filter((x) => x.code !== null).map((x) => x.code);
    const unique = new Set(codes);
    expect(codes.length).toBe(unique.size);
  }
  /*
backend converts
empty code → null
*/
  validateBackendRules(data: PaymentContractData) {
    data.items.forEach((item) => {
      expect(item.id).toBeDefined();
    });
  }
  validateExpectedValues(data: PaymentContractData) {
    const expected = ["Prepaid", "Postpaid"];
    const actual = data.items.map((x) => x.name);
    expected.forEach((value) => {
      expect(actual).toContain(value);
    });
  }
}
