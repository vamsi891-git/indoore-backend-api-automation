import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { test as authTest } from "../../../fixtures/auth.fixture";
import { MeterValidationApi } from "../Api/meter-validation.api";
import { meterValidationData } from "../Data/meter-validation.data";
import { MeterValidationMapper } from "../Mapper/meter-validation.mapper";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { pauseMs } from "../utils/response.helper";
import {
  MeterReplacementCommonValidator,
  meterReplacementAuthData,
  meterReplacementPaths,
} from "../Validator/meter-replacement-common.validator";

test.describe("Meter Replacement Meter Validation API — Negative & Edge", () => {
  test(
    "Unknown / invalid serials return valid:false",
    {
      tag: ["@meter-replacement", "@meter-validation", "@negative"],
    },
    async ({ authenticatedApi }) => {
      const api = new MeterValidationApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();

      const cases = [
        meterValidationData.invalidMeterSerial,
        meterValidationData.alphaMeterSerial,
        meterValidationData.alphaNumericMeterSerial,
        meterValidationData.specialCharacterMeterSerial,
        meterValidationData.sqlInjectionMeterSerial,
        meterValidationData.xssMeterSerial,
        meterValidationData.unicodeMeterSerial,
        meterValidationData.emojiMeterSerial,
        meterValidationData.veryLongMeterSerial,
        meterValidationData.singleDigitMeterSerial,
        meterValidationData.zeroMeterSerial,
      ];

      for (const [index, meterSerial] of cases.entries()) {
        // Pace requests so this 11-case burst doesn't trip the API's rate
        // limiter; withRateLimitRetry backs off on individual 429s, but a
        // tight back-to-back loop was hitting 429 on every single call.
        if (index > 0) {
          await pauseMs(300);
        }

        const { rawResponse, responseBody } =
          await api.validateMeter(meterSerial);

        validation.execute(`Status (${meterSerial.slice(0, 12)})`, () =>
          assert.validateStatusCode(rawResponse, 200, responseBody),
        );

        const mapped = MeterValidationMapper.map(responseBody);

        validation.execute(`Invalid (${meterSerial.slice(0, 12)})`, () => {
          expect(mapped.success).toBeTruthy();
          expect(mapped.valid).toBeFalsy();
          expect(mapped.message.length).toBeGreaterThan(0);
        });
      }

      validation.printSummary("Meter Validation — Invalid Serials", 0);
    },
  );

  test(
    "Empty / missing meterSerial returns validation error",
    {
      tag: ["@meter-replacement", "@meter-validation", "@negative"],
    },
    async ({ authenticatedApi }) => {
      const api = new MeterValidationApi(authenticatedApi);
      const validation = new ValidationEngine();

      const empty = await api.validateMeter(
        meterValidationData.emptyMeterSerial,
      );
      validation.execute("Empty status", () => {
        expect(empty.rawResponse.status()).toBe(400);
      });
      validation.execute("Empty error", () =>
        MeterReplacementCommonValidator.validateErrorEnvelope(
          empty.responseBody,
          ["VALIDATION_ERROR"],
        ),
      );

      const missing = await api.validateMeterWithoutSerial();
      validation.execute("Missing status", () => {
        expect(missing.rawResponse.status()).toBe(400);
      });
      validation.execute("Missing error", () =>
        MeterReplacementCommonValidator.validateErrorEnvelope(
          missing.responseBody,
          ["VALIDATION_ERROR"],
        ),
      );

      const whitespace = await api.validateMeter(
        meterValidationData.whitespaceMeterSerial,
      );
      validation.execute("Whitespace status", () => {
        expect([400, 200]).toContain(whitespace.rawResponse.status());
      });

      validation.printSummary("Meter Validation — Empty/Missing", 0);
    },
  );

  test(
    "Leading and trailing spaces are trimmed for known serial",
    {
      tag: ["@meter-replacement", "@meter-validation", "@edge"],
    },
    async ({ authenticatedApi }) => {
      const api = new MeterValidationApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();

      const baseSerial = meterValidationData.validMeterSerial;
      const plain = await api.validateMeter(baseSerial);
      const plainMapped = MeterValidationMapper.map(plain.responseBody);

      validation.execute("Baseline status", () =>
        assert.validateStatusCode(plain.rawResponse, 200, plain.responseBody),
      );

      for (const meterSerial of [
        meterValidationData.leadingSpaceMeterSerial,
        meterValidationData.trailingSpaceMeterSerial,
      ]) {
        const { rawResponse, responseBody } =
          await api.validateMeter(meterSerial);
        const mapped = MeterValidationMapper.map(responseBody);

        validation.execute(`Status (${meterSerial.trim()})`, () =>
          assert.validateStatusCode(rawResponse, 200, responseBody),
        );
        validation.execute(`Trimmed serial (${meterSerial.trim()})`, () => {
          expect(mapped.meterSerial).toBe(baseSerial);
          expect(mapped.valid).toBe(plainMapped.valid);
          expect(mapped.meterLookupId).toBe(plainMapped.meterLookupId);
        });
      }

      validation.printSummary("Meter Validation — Trim Edge", 0);
    },
  );
});

authTest.describe("Meter Replacement Meter Validation API — Auth Negative", () => {
  authTest(
    "Missing Authorization returns 401",
    {
      tag: ["@meter-replacement", "@meter-validation", "@negative", "@auth"],
    },
    async ({ unauthenticatedApi }) => {
      const validation = new ValidationEngine();
      const rawResponse =
        await MeterReplacementCommonValidator.getUnauthenticated(
          unauthenticatedApi,
          meterReplacementPaths.meterValidate,
          { params: { meterSerial: meterValidationData.validMeterSerial } },
        );
      const body = await rawResponse.json().catch(() => ({}));

      validation.execute("Unauthorized", () =>
        MeterReplacementCommonValidator.validateUnauthorizedError(
          rawResponse.status(),
          body,
        ),
      );
      validation.printSummary("Meter Validation — Missing Auth", 0);
    },
  );

  authTest(
    "Invalid Bearer token returns 401",
    {
      tag: ["@meter-replacement", "@meter-validation", "@negative", "@auth"],
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
            meterReplacementPaths.meterValidate,
            {
              params: { meterSerial: meterValidationData.validMeterSerial },
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

      validation.printSummary("Meter Validation — Invalid Auth", 0);
    },
  );

  authTest(
    "Disallowed HTTP methods are rejected",
    {
      tag: ["@meter-replacement", "@meter-validation", "@negative"],
    },
    async ({ unauthenticatedApi }) => {
      const validation = new ValidationEngine();
      const callers =
        MeterReplacementCommonValidator.getDisallowedMethodCallers(
          unauthenticatedApi,
          meterReplacementPaths.meterValidate,
        );

      for (const method of meterReplacementAuthData.disallowedMethods) {
        const rawResponse = await callers[method]();
        validation.execute(`${method} status`, () =>
          MeterReplacementCommonValidator.validateDisallowedMethodRejected(
            rawResponse.status(),
          ),
        );
      }

      validation.printSummary("Meter Validation — Disallowed Methods", 0);
    },
  );
});
