import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { test as authTest } from "../../../fixtures/auth.fixture";
import { ConsumerDetailApi } from "../Api/consumer-detail.api";
import { consumerDetailData } from "../Data/consumer-detail.data";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import {
  MeterReplacementCommonValidator,
  meterReplacementAuthData,
  meterReplacementPaths,
} from "../Validator/meter-replacement-common.validator";

test.describe("Meter Replacement Consumer Detail API — Negative & Edge", () => {
  test(
    "Unknown consumer returns 404 CONSUMER_NOT_FOUND",
    {
      tag: ["@meter-replacement", "@consumer-detail", "@negative"],
    },
    async ({ authenticatedApi }) => {
      const api = new ConsumerDetailApi(authenticatedApi);
      const validation = new ValidationEngine();

      const { rawResponse, responseBody } = await api.getConsumerDetail(
        consumerDetailData.invalidConsumerId,
      );

      validation.execute("Status", () => {
        expect(rawResponse.status()).toBe(404);
      });

      validation.execute("Error envelope", () =>
        MeterReplacementCommonValidator.validateErrorEnvelope(
          responseBody,
          ["CONSUMER_NOT_FOUND"],
        ),
      );

      validation.printSummary("Consumer Detail — Not Found", 0);
    },
  );

  test(
    "Invalid consumer ids return validation error",
    {
      tag: ["@meter-replacement", "@consumer-detail", "@negative"],
    },
    async ({ authenticatedApi }) => {
      const api = new ConsumerDetailApi(authenticatedApi);
      const validation = new ValidationEngine();

      const cases: Array<number | string> = [
        consumerDetailData.zeroConsumerId,
        consumerDetailData.negativeConsumerId,
        consumerDetailData.decimalConsumerId,
        consumerDetailData.stringConsumerId,
        consumerDetailData.specialCharacterConsumerId,
        consumerDetailData.sqlInjectionConsumerId,
        consumerDetailData.xssConsumerId,
        consumerDetailData.unicodeConsumerId,
        consumerDetailData.emojiConsumerId,
        consumerDetailData.whitespaceConsumerId,
      ];

      for (const consumerId of cases) {
        const { rawResponse, responseBody } =
          await api.getConsumerDetail(consumerId);

        validation.execute(`Status (${String(consumerId).slice(0, 16)})`, () =>
          MeterReplacementCommonValidator.validateClientOrNotFound(
            rawResponse.status(),
          ),
        );

        validation.execute(`Error (${String(consumerId).slice(0, 16)})`, () => {
          expect(responseBody.success).toBeFalsy();
        });
      }

      validation.printSummary("Consumer Detail — Invalid IDs", 0);
    },
  );

  test(
    "Boundary integer consumer ids do not 500",
    {
      tag: ["@meter-replacement", "@consumer-detail", "@edge"],
    },
    async ({ authenticatedApi }) => {
      const api = new ConsumerDetailApi(authenticatedApi);
      const validation = new ValidationEngine();

      for (const consumerId of [
        consumerDetailData.maxIntegerConsumerId,
        consumerDetailData.minIntegerConsumerId,
      ]) {
        const { rawResponse, responseBody } =
          await api.getConsumerDetail(consumerId);

        validation.execute(`Status (${consumerId})`, () => {
          expect(rawResponse.status()).toBeLessThan(500);
        });

        validation.execute(`Handled (${consumerId})`, () => {
          expect(
            rawResponse.status() === 200 || responseBody.success === false,
          ).toBeTruthy();
        });
      }

      validation.printSummary("Consumer Detail — Boundary IDs", 0);
    },
  );

  test(
    "Valid consumer returns success envelope",
    {
      tag: ["@meter-replacement", "@consumer-detail", "@edge"],
    },
    async ({ authenticatedApi }) => {
      const api = new ConsumerDetailApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();

      const { rawResponse, responseBody } = await api.getConsumerDetail(
        consumerDetailData.consumerId,
      );

      validation.execute("Status", () =>
        assert.validateStatusCode(rawResponse, 200, responseBody),
      );
      validation.execute("Success", () => {
        expect(responseBody.success).toBeTruthy();
        expect(responseBody.data).toBeDefined();
      });

      validation.printSummary("Consumer Detail — Valid Sanity", 0);
    },
  );
});

authTest.describe("Meter Replacement Consumer Detail API — Auth Negative", () => {
  authTest(
    "Missing Authorization returns 401",
    {
      tag: ["@meter-replacement", "@consumer-detail", "@negative", "@auth"],
    },
    async ({ unauthenticatedApi }) => {
      const validation = new ValidationEngine();
      const rawResponse =
        await MeterReplacementCommonValidator.getUnauthenticated(
          unauthenticatedApi,
          meterReplacementPaths.consumerDetail(consumerDetailData.consumerId),
        );
      const body = await rawResponse.json().catch(() => ({}));

      validation.execute("Unauthorized", () =>
        MeterReplacementCommonValidator.validateUnauthorizedError(
          rawResponse.status(),
          body,
        ),
      );
      validation.printSummary("Consumer Detail — Missing Auth", 0);
    },
  );

  authTest(
    "Invalid Bearer token returns 401",
    {
      tag: ["@meter-replacement", "@consumer-detail", "@negative", "@auth"],
    },
    async ({ unauthenticatedApi }) => {
      const validation = new ValidationEngine();

      for (const authorization of [
        meterReplacementAuthData.invalidBearerToken,
        meterReplacementAuthData.malformedBearerToken,
        meterReplacementAuthData.emptyBearerToken,
      ]) {
        const rawResponse =
          await MeterReplacementCommonValidator.getUnauthenticated(
            unauthenticatedApi,
            meterReplacementPaths.consumerDetail(consumerDetailData.consumerId),
            { headers: { Authorization: authorization } },
          );
        const body = await rawResponse.json().catch(() => ({}));

        validation.execute(`Unauthorized (${authorization.slice(0, 18)})`, () =>
          MeterReplacementCommonValidator.validateUnauthorizedError(
            rawResponse.status(),
            body,
          ),
        );
      }

      validation.printSummary("Consumer Detail — Invalid Auth", 0);
    },
  );

  authTest(
    "Disallowed HTTP methods are rejected",
    {
      tag: ["@meter-replacement", "@consumer-detail", "@negative"],
    },
    async ({ unauthenticatedApi }) => {
      const validation = new ValidationEngine();
      const callers =
        MeterReplacementCommonValidator.getDisallowedMethodCallers(
          unauthenticatedApi,
          meterReplacementPaths.consumerDetail(consumerDetailData.consumerId),
        );

      for (const method of meterReplacementAuthData.disallowedMethods) {
        const rawResponse = await callers[method]();
        validation.execute(`${method} status`, () =>
          MeterReplacementCommonValidator.validateDisallowedMethodRejected(
            rawResponse.status(),
          ),
        );
      }

      validation.printSummary("Consumer Detail — Disallowed Methods", 0);
    },
  );
});
