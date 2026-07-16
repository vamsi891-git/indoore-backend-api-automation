import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { test as authTest } from "../../../fixtures/auth.fixture";
import { ConsumerSearchApi } from "../Api/consumer-search.api";
import { consumerSearchData } from "../Data/consumer-search.data";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import {
  MeterReplacementCommonValidator,
  meterReplacementAuthData,
  meterReplacementPaths,
} from "../Validator/meter-replacement-common.validator";
test.describe("Meter Replacement Consumer Search API — Negative & Edge", () => {
  test("Empty and whitespace search return validation error",
    {
      tag: ["@meter-replacement", "@consumer-search", "@negative"],
    },
    async ({ authenticatedApi }) => {
      const api = new ConsumerSearchApi(authenticatedApi);
      const validation = new ValidationEngine();
      for (const search of [
        consumerSearchData.emptySearch,
        consumerSearchData.whitespaceSearch,
      ]) {
        const { rawResponse, responseBody } = await api.searchConsumer(search);
        validation.execute(`Status (${JSON.stringify(search)})`, () => {
          expect(rawResponse.status()).toBe(400);
        });
        validation.execute(`Error (${JSON.stringify(search)})`, () =>
          MeterReplacementCommonValidator.validateErrorEnvelope(responseBody,["VALIDATION_ERROR"],),
        );
      }
      validation.printSummary("Consumer Search — Empty/Whitespace", 0);
    },
  );
  test("Unknown search returns consumer not found",
    {
      tag: ["@meter-replacement", "@consumer-search", "@negative"],
    },
    async ({ authenticatedApi }) => {
      const api = new ConsumerSearchApi(authenticatedApi);
      const validation = new ValidationEngine();
      for (const search of [
        consumerSearchData.invalidSearch,
        consumerSearchData.invalidConsumerName,
        consumerSearchData.specialCharactersSearch,
        consumerSearchData.sqlInjection,
        consumerSearchData.xssInjection,
        consumerSearchData.unicodeSearch,
        consumerSearchData.emojiSearch,
        consumerSearchData.longSearch,
      ]) {
        const { rawResponse, responseBody } = await api.searchConsumer(search);
                validation.execute(`Status (${search.slice(0, 16)})`, () => {
                    expect([400, 404]).toContain(rawResponse.status());
                });
                validation.execute(`Success false (${search.slice(0, 16)})`, () => {
                    expect(responseBody.success).toBeFalsy();
                });
      }
      validation.printSummary("Consumer Search — Not Found / Injection", 0);
    },
  );
  test("Case and identity variants return matching consumers",
    {
      tag: ["@meter-replacement", "@consumer-search", "@edge", "@positive"],
    },
    async ({ authenticatedApi }) => {
      const api = new ConsumerSearchApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const cases = [
        consumerSearchData.validSearch,
        consumerSearchData.validConsumerId,
        consumerSearchData.meterSerialSearch,
        consumerSearchData.lowercaseSearch,
        consumerSearchData.leadingSpaceSearch,
      ];
      for (const search of cases) {
        const { rawResponse, responseBody } = await api.searchConsumer(search);
        validation.execute(`Status (${search})`, () =>
          assert.validateStatusCode(rawResponse, 200, responseBody),
        );
        validation.execute(`Has data (${search})`, () => {
          expect(responseBody.success).toBeTruthy();
          expect(Array.isArray(responseBody.data)).toBeTruthy();
          expect(responseBody.data.length).toBeGreaterThan(0);
        });
      }
      validation.printSummary("Consumer Search — Identity Variants", 0);
    },
  );
});
authTest.describe("Meter Replacement Consumer Search API — Auth Negative", () => {
  authTest("Missing Authorization returns 401",
    {
      tag: ["@meter-replacement", "@consumer-search", "@negative", "@auth"],
    },
    async ({ unauthenticatedApi }) => {
      const validation = new ValidationEngine();
      const rawResponse =
        await MeterReplacementCommonValidator.getUnauthenticated(
          unauthenticatedApi,
          meterReplacementPaths.consumerSearch,
          { params: { search: consumerSearchData.validSearch } },
        );
      const body = await rawResponse.json().catch(() => ({}));
      validation.execute("Unauthorized", () =>
        MeterReplacementCommonValidator.validateUnauthorizedError(rawResponse.status(),body,),
      );
      validation.printSummary("Consumer Search — Missing Auth", 0);
    },
  );
  authTest("Invalid Bearer token returns 401",
    {
      tag: ["@meter-replacement", "@consumer-search", "@negative", "@auth"],
    },
    async ({ unauthenticatedApi }) => {
      const validation = new ValidationEngine();
      for (const authorization of [
        meterReplacementAuthData.invalidBearerToken,
        meterReplacementAuthData.malformedBearerToken,
        meterReplacementAuthData.emptyBearerToken,
      ]) {
        const rawResponse =await MeterReplacementCommonValidator.getUnauthenticated(unauthenticatedApi,
            meterReplacementPaths.consumerSearch,
            {
              params: { search: consumerSearchData.validSearch },
              headers: { Authorization: authorization },
            },
          );
        const body = await rawResponse.json().catch(() => ({}));
        validation.execute(`Unauthorized (${authorization.slice(0, 18)})`, () =>
          MeterReplacementCommonValidator.validateUnauthorizedError(
            rawResponse.status(),
            body,
          ),
        );
      }
      validation.printSummary("Consumer Search — Invalid Auth", 0);
    },
  );
  authTest("Disallowed HTTP methods are rejected",
    {
      tag: ["@meter-replacement", "@consumer-search", "@negative"],
    },
    async ({ unauthenticatedApi }) => {
      const validation = new ValidationEngine();
      const callers =
        MeterReplacementCommonValidator.getDisallowedMethodCallers(
          unauthenticatedApi,
          meterReplacementPaths.consumerSearch,
        );
      for (const method of meterReplacementAuthData.disallowedMethods) {
        const rawResponse = await callers[method]();
        const body = await rawResponse.json().catch(() => ({}));

        validation.execute(`${method} status`, () =>
          MeterReplacementCommonValidator.validateDisallowedMethodRejected(
            rawResponse.status(),
          ),
        );
        validation.execute(`${method} no data array`, () => {
          expect(Array.isArray(body?.data)).toBeFalsy();
        });
      }

      validation.printSummary("Consumer Search — Disallowed Methods", 0);
    },
  );
});
