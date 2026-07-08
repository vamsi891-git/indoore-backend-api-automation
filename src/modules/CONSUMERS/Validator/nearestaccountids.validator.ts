import { expect } from "@playwright/test";
import {
  NearestAccountIdsData,
  NearestAccountIdsErrorResponse,
  NearestAccountIdsResponse,
  NearestAccountIdsScenario,
  accountIdNumericDistance,
  extractTrailingAccountIdNumber,
} from "../Mapper/nearestaccountids.mapper";

export class NearestAccountIdsValidator {
  validateResponse(response: NearestAccountIdsResponse): void {
    expect(response.success).toBeTruthy();
    expect(response.data).toBeDefined();
  }

  validateRootStructure(data: NearestAccountIdsData): void {
    expect(data).toHaveProperty("accountId");
    expect(data).toHaveProperty("numericSuffix");
    expect(data).toHaveProperty("maxDistance");
    expect(data).toHaveProperty("nearestAccountIds");
    expect(Array.isArray(data.nearestAccountIds)).toBeTruthy();
  }

  validateAccountIdEcho(data: NearestAccountIdsData, requestedAccountId: string): void {
    expect(data.accountId?.trim()).toBe(requestedAccountId.trim());
  }

  validateNumericSuffixType(data: NearestAccountIdsData): void {
    expect(
      data.numericSuffix === null || typeof data.numericSuffix === "number",
    ).toBeTruthy();
  }

  validateMaxDistanceType(data: NearestAccountIdsData): void {
    expect(typeof data.maxDistance).toBe("number");
    expect(data.maxDistance).toBeGreaterThanOrEqual(0);
  }

  validateNearestAccountIdsShape(data: NearestAccountIdsData): void {
    for (const id of data.nearestAccountIds) {
      expect(typeof id).toBe("string");
      expect(id.trim().length).toBeGreaterThan(0);
      expect(extractTrailingAccountIdNumber(id)).not.toBeNull();
    }
  }

  validateExcludesInputAccount(
    data: NearestAccountIdsData,
    requestedAccountId: string,
  ): void {
    const input = requestedAccountId.trim();
    for (const id of data.nearestAccountIds) {
      expect(id.trim()).not.toBe(input);
    }
  }

  validateSortedByDistance(data: NearestAccountIdsData): void {
    if (data.numericSuffix == null || data.nearestAccountIds.length < 2) {
      return;
    }
    const distances = data.nearestAccountIds.map(
      (id) => accountIdNumericDistance(data.numericSuffix!, id)!,
    );
    for (let i = 1; i < distances.length; i += 1) {
      expect(distances[i]).toBeGreaterThanOrEqual(distances[i - 1]!);
      if (distances[i] === distances[i - 1]) {
        expect(
          data.nearestAccountIds[i]!.localeCompare(data.nearestAccountIds[i - 1]!),
        ).toBeGreaterThanOrEqual(0);
      }
    }
  }

  validateWithinMaxDistance(data: NearestAccountIdsData): void {
    if (data.numericSuffix == null) {
      return;
    }
    for (const id of data.nearestAccountIds) {
      const distance = accountIdNumericDistance(data.numericSuffix, id);
      expect(distance).not.toBeNull();
      expect(distance!).toBeLessThanOrEqual(data.maxDistance);
    }
  }

  validateNearestFound(
    response: NearestAccountIdsResponse,
    requestedAccountId: string,
    limit?: number,
  ): void {
    const data = response.data;
    expect(data.numericSuffix).toBe(
      extractTrailingAccountIdNumber(requestedAccountId),
    );
    expect(data.maxDistance).toBeGreaterThan(0);
    expect(data.nearestAccountIds.length).toBeGreaterThan(0);
    if (limit != null) {
      expect(data.nearestAccountIds.length).toBeLessThanOrEqual(limit);
    }
    this.validateExcludesInputAccount(data, requestedAccountId);
    this.validateSortedByDistance(data);
    this.validateWithinMaxDistance(data);
  }

  validateDefaultLimit(response: NearestAccountIdsResponse): void {
    expect(response.data.nearestAccountIds.length).toBeLessThanOrEqual(10);
    expect(response.data.nearestAccountIds.length).toBeGreaterThan(0);
  }

  validateCustomLimit(
    response: NearestAccountIdsResponse,
    limit: number,
  ): void {
    expect(response.data.nearestAccountIds.length).toBe(limit);
  }

  validateMaxDistanceEmpty(response: NearestAccountIdsResponse): void {
    expect(response.data.maxDistance).toBe(1);
    expect(response.data.nearestAccountIds).toEqual([]);
  }

  validateNoNumericSuffix(
    response: NearestAccountIdsResponse,
    requestedAccountId: string,
  ): void {
    expect(response.data.accountId).toBe(requestedAccountId.trim());
    expect(response.data.numericSuffix).toBeNull();
    expect(response.data.maxDistance).toBe(0);
    expect(response.data.nearestAccountIds).toEqual([]);
  }

  validatePrefixedAccountId(response: NearestAccountIdsResponse): void {
    expect(response.data.numericSuffix).toBe(8787878787);
    expect(response.data.nearestAccountIds.length).toBeGreaterThan(0);
  }

  validateValidationError(
    responseBody: NearestAccountIdsErrorResponse,
    field: string,
  ): void {
    expect(responseBody.success).toBeFalsy();
    expect(responseBody.error.code).toBe("VALIDATION_ERROR");
    expect(responseBody.error.message.toLowerCase()).toContain(
      field.toLowerCase(),
    );
    const fieldErrors = responseBody.error.details?.fieldErrors?.[field];
    expect(Array.isArray(fieldErrors) && fieldErrors.length > 0).toBeTruthy();
  }

  validateScenario(
    response: NearestAccountIdsResponse,
    scenario: NearestAccountIdsScenario,
    requestedAccountId: string,
    limit?: number,
  ): void {
    this.validateAccountIdEcho(response.data, requestedAccountId);

    switch (scenario) {
      case "nearest_found":
        this.validateNearestFound(response, requestedAccountId, limit);
        break;
      case "default_limit":
        this.validateDefaultLimit(response);
        break;
      case "custom_limit":
        this.validateCustomLimit(response, limit ?? 1);
        break;
      case "max_distance_empty":
        this.validateMaxDistanceEmpty(response);
        break;
      case "no_numeric_suffix":
        this.validateNoNumericSuffix(response, requestedAccountId);
        break;
      case "prefixed_account_id":
        this.validatePrefixedAccountId(response);
        break;
      default:
        break;
    }
  }
}
