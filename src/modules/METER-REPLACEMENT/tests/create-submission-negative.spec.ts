import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { test as authTest } from "../../../fixtures/auth.fixture";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { CreateSubmissionApi } from "../Api/create-submission.api";
import { ConsumerDetailApi } from "../Api/consumer-detail.api";
import {
  buildCreateSubmissionPayload,
  createSubmissionData,
} from "../Data/create-submission.data";
import {
  MeterReplacementCommonValidator,
  meterReplacementAuthData,
  meterReplacementPaths,
  type MeterReplacementErrorBody,
} from "../Validator/meter-replacement-common.validator";
import { findEligibleConsumer } from "../utils/create-submission.helper";
import {
  pauseMs,
  safeResponseJson,
  withRateLimitRetry,
} from "../utils/response.helper";

test.describe("Meter Replacement Create Submission API — Negative & Edge", () => {
  test(
    "Empty body returns 400 VALIDATION_ERROR",
    {
      tag: ["@meter-replacement", "@create-submission", "@negative"],
    },
    async ({ authenticatedApi }) => {
      const api = new CreateSubmissionApi(authenticatedApi);
      const validation = new ValidationEngine();

      const { rawResponse, responseBody } = await api.createSubmission({});

      validation.execute("Status", () => {
        expect(rawResponse.status()).toBe(400);
      });
      validation.execute("Error", () =>
        MeterReplacementCommonValidator.validateErrorEnvelope(responseBody, [
          "VALIDATION_ERROR",
        ]),
      );

      validation.printSummary("Create Submission — Empty Body", 0);
    },
  );

  test(
    "Swagger zero / string payload returns 400 VALIDATION_ERROR",
    {
      tag: ["@meter-replacement", "@create-submission", "@negative"],
    },
    async ({ authenticatedApi }) => {
      const api = new CreateSubmissionApi(authenticatedApi);
      const validation = new ValidationEngine();

      const { rawResponse, responseBody } = await api.createSubmission(
        createSubmissionData.zeroIdsPayload,
      );

      validation.execute("Status", () => {
        expect(rawResponse.status()).toBe(400);
      });
      validation.execute("Error", () =>
        MeterReplacementCommonValidator.validateErrorEnvelope(responseBody, [
          "VALIDATION_ERROR",
        ]),
      );

      validation.printSummary("Create Submission — Zero IDs", 0);
    },
  );

  test(
    "Unknown consumer returns 404 CONSUMER_NOT_FOUND",
    {
      tag: ["@meter-replacement", "@create-submission", "@negative"],
    },
    async ({ authenticatedApi }) => {
      const api = new CreateSubmissionApi(authenticatedApi);
      const validation = new ValidationEngine();

      const payload = buildCreateSubmissionPayload({
        consumerId: createSubmissionData.invalidConsumerId,
        oldMeterLookupId: 1,
        oldMeterSerial: "85080158",
        newMeterLookupId: 1,
        newMeterSerial: createSubmissionData.unknownNewMeterSerial,
      });

      const { rawResponse, responseBody } =
        await api.createSubmission(payload);

      validation.execute("Status", () => {
        expect(rawResponse.status()).toBe(404);
      });
      validation.execute("Error", () =>
        MeterReplacementCommonValidator.validateErrorEnvelope(responseBody, [
          "CONSUMER_NOT_FOUND",
        ]),
      );

      validation.printSummary("Create Submission — Consumer Not Found", 0);
    },
  );

  test(
    "Ineligible consumer returns 409 CONSUMER_NOT_ELIGIBLE",
    {
      tag: ["@meter-replacement", "@create-submission", "@negative"],
    },
    async ({ authenticatedApi }) => {
      const detailApi = new ConsumerDetailApi(authenticatedApi);
      const createApi = new CreateSubmissionApi(authenticatedApi);
      const validation = new ValidationEngine();

      const detail = await detailApi.getConsumerDetail(
        createSubmissionData.ineligibleConsumerId,
      );

      if (
        detail.rawResponse.status() !== 200 ||
        detail.responseBody.data?.replacementEligible === true
      ) {
        test.skip(
          true,
          `Consumer ${createSubmissionData.ineligibleConsumerId} is eligible or missing; need a PENDING consumer for this negative`,
        );
        return;
      }

      const d = detail.responseBody.data!;
      const payload = buildCreateSubmissionPayload({
        consumerId: d.consumerId,
        oldMeterLookupId: d.oldMeterLookupId,
        oldMeterSerial: d.oldMeterSerial,
        newMeterLookupId:
          createSubmissionData.activeReplacementNewMeter.newMeterLookupId,
        newMeterSerial:
          createSubmissionData.activeReplacementNewMeter.newMeterSerial,
        latitude: Number(d.latitude) || createSubmissionData.defaultLatitude,
        longitude: Number(d.longitude) || createSubmissionData.defaultLongitude,
      });

      const { rawResponse, responseBody } =
        await createApi.createSubmission(payload);

      validation.execute("Status", () => {
        expect(rawResponse.status()).toBe(409);
      });
      validation.execute("Error", () =>
        MeterReplacementCommonValidator.validateErrorEnvelope(responseBody, [
          "CONSUMER_NOT_ELIGIBLE",
        ]),
      );

      validation.printSummary("Create Submission — Not Eligible", 0);
    },
  );

  test(
    "Unknown new meter returns 400 VALIDATION_ERROR",
    {
      tag: ["@meter-replacement", "@create-submission", "@negative"],
    },
    async ({ authenticatedApi }) => {
      const api = new CreateSubmissionApi(authenticatedApi);
      const validation = new ValidationEngine();

      const consumer = await findEligibleConsumer(authenticatedApi);
      const payload = buildCreateSubmissionPayload({
        consumerId: consumer.consumerId,
        oldMeterLookupId: consumer.oldMeterLookupId,
        oldMeterSerial: consumer.oldMeterSerial,
        newMeterLookupId: 1,
        newMeterSerial: createSubmissionData.unknownNewMeterSerial,
        latitude: Number(consumer.latitude) || createSubmissionData.defaultLatitude,
        longitude:
          Number(consumer.longitude) || createSubmissionData.defaultLongitude,
      });

      const { rawResponse, responseBody } = await api.createSubmission(payload);

      validation.execute("Status", () => {
        expect(rawResponse.status()).toBe(400);
      });
      validation.execute("Error", () =>
        MeterReplacementCommonValidator.validateErrorEnvelope(responseBody, [
          "VALIDATION_ERROR",
        ]),
      );
      validation.execute("Message", () => {
        const err = responseBody as MeterReplacementErrorBody;
        expect(String(err.error?.message ?? "")).toMatch(
          /new meter not found/i,
        );
      });

      validation.printSummary("Create Submission — New Meter Not Found", 0);
    },
  );

  test(
    "Mismatched old meter serial returns 400 VALIDATION_ERROR",
    {
      tag: ["@meter-replacement", "@create-submission", "@negative"],
    },
    async ({ authenticatedApi }) => {
      const api = new CreateSubmissionApi(authenticatedApi);
      const validation = new ValidationEngine();

      const consumer = await findEligibleConsumer(authenticatedApi);
      const payload = buildCreateSubmissionPayload({
        consumerId: consumer.consumerId,
        oldMeterLookupId: consumer.oldMeterLookupId,
        oldMeterSerial: createSubmissionData.mismatchedOldMeterSerial,
        newMeterLookupId:
          createSubmissionData.activeReplacementNewMeter.newMeterLookupId,
        newMeterSerial:
          createSubmissionData.activeReplacementNewMeter.newMeterSerial,
        latitude: Number(consumer.latitude) || createSubmissionData.defaultLatitude,
        longitude:
          Number(consumer.longitude) || createSubmissionData.defaultLongitude,
      });

      const { rawResponse, responseBody } = await api.createSubmission(payload);

      validation.execute("Status", () => {
        expect(rawResponse.status()).toBe(400);
      });
      validation.execute("Error", () =>
        MeterReplacementCommonValidator.validateErrorEnvelope(responseBody, [
          "VALIDATION_ERROR",
        ]),
      );
      validation.execute("Message", () => {
        const err = responseBody as MeterReplacementErrorBody;
        expect(String(err.error?.message ?? "")).toMatch(
          /old meter not found/i,
        );
      });

      validation.printSummary("Create Submission — Old Meter Mismatch", 0);
    },
  );

  test(
    "New meter already in active replacement returns 400 VALIDATION_ERROR",
    {
      tag: ["@meter-replacement", "@create-submission", "@negative"],
    },
    async ({ authenticatedApi }) => {
      const api = new CreateSubmissionApi(authenticatedApi);
      const validation = new ValidationEngine();

      const consumer = await findEligibleConsumer(authenticatedApi);
      const payload = buildCreateSubmissionPayload({
        consumerId: consumer.consumerId,
        oldMeterLookupId: consumer.oldMeterLookupId,
        oldMeterSerial: consumer.oldMeterSerial,
        newMeterLookupId:
          createSubmissionData.activeReplacementNewMeter.newMeterLookupId,
        newMeterSerial:
          createSubmissionData.activeReplacementNewMeter.newMeterSerial,
        latitude: Number(consumer.latitude) || createSubmissionData.defaultLatitude,
        longitude:
          Number(consumer.longitude) || createSubmissionData.defaultLongitude,
      });

      const { rawResponse, responseBody } = await api.createSubmission(payload);

      validation.execute("Status", () => {
        expect(rawResponse.status()).toBe(400);
      });
      validation.execute("Error", () =>
        MeterReplacementCommonValidator.validateErrorEnvelope(responseBody, [
          "VALIDATION_ERROR",
        ]),
      );
      validation.execute("Message", () => {
        const err = responseBody as MeterReplacementErrorBody;
        expect(String(err.error?.message ?? "")).toMatch(
          /already used in an active replacement/i,
        );
      });

      validation.printSummary(
        "Create Submission — New Meter In Active Replacement",
        0,
      );
    },
  );

  test(
    "Disallowed methods on create submission path are rejected",
    {
      tag: ["@meter-replacement", "@create-submission", "@negative"],
    },
    async ({ authenticatedApi }) => {
      const validation = new ValidationEngine();
      const path = meterReplacementPaths.createSubmission;

      for (const method of ["GET", "PUT", "PATCH", "DELETE"] as const) {
        const rawResponse = await withRateLimitRetry(() => {
          if (method === "GET") {
            return authenticatedApi.get(path);
          }
          if (method === "PUT") {
            return authenticatedApi.put(path, { data: {} });
          }
          if (method === "PATCH") {
            return authenticatedApi.patch(path, { data: {} });
          }
          return authenticatedApi.delete(path);
        });

        validation.execute(`${method} rejected`, () =>
          MeterReplacementCommonValidator.validateDisallowedMethodRejected(
            rawResponse.status(),
          ),
        );
      }

      validation.printSummary("Create Submission — Disallowed Methods", 0);
    },
  );
});

authTest.describe("Meter Replacement Create Submission API — Auth Negative", () => {
  authTest(
    "Missing Authorization returns 401",
    {
      tag: [
        "@meter-replacement",
        "@create-submission",
        "@negative",
        "@auth",
      ],
    },
    async ({ unauthenticatedApi }) => {
      const validation = new ValidationEngine();

      const rawResponse = await withRateLimitRetry(() =>
        unauthenticatedApi.post(meterReplacementPaths.createSubmission, {
          data: createSubmissionData.zeroIdsPayload,
        }),
      );
      const responseBody = await safeResponseJson(rawResponse);

      validation.execute("Unauthorized", () =>
        MeterReplacementCommonValidator.validateUnauthorizedError(
          rawResponse.status(),
          responseBody,
        ),
      );

      validation.printSummary("Create Submission — Missing Auth", 0);
    },
  );

  authTest(
    "Invalid Bearer token returns 401",
    {
      tag: [
        "@meter-replacement",
        "@create-submission",
        "@negative",
        "@auth",
      ],
    },
    async ({ unauthenticatedApi }) => {
      const validation = new ValidationEngine();

      const cases = [
        createSubmissionData.invalidBearerToken,
        createSubmissionData.malformedBearerToken,
        createSubmissionData.emptyBearerToken,
      ];

      for (const authorization of cases) {
        const rawResponse = await withRateLimitRetry(() =>
          unauthenticatedApi.post(meterReplacementPaths.createSubmission, {
            headers: { Authorization: authorization },
            data: createSubmissionData.zeroIdsPayload,
          }),
        );
        const responseBody = await safeResponseJson(rawResponse);

        validation.execute(`Unauthorized (${authorization.slice(0, 20)})`, () =>
          MeterReplacementCommonValidator.validateUnauthorizedError(
            rawResponse.status(),
            responseBody,
          ),
        );

        validation.execute(`Success false (${authorization.slice(0, 12)})`, () =>
          expect(responseBody.success).toBeFalsy(),
        );

        await pauseMs(400);
      }

      validation.printSummary("Create Submission — Invalid Token", 0);
    },
  );

  authTest(
    "Auth negatives reject with expected codes",
    {
      tag: [
        "@meter-replacement",
        "@create-submission",
        "@negative",
        "@auth",
      ],
    },
    async ({ unauthenticatedApi }) => {
      const validation = new ValidationEngine();

      const rawResponse = await withRateLimitRetry(() =>
        unauthenticatedApi.post(meterReplacementPaths.createSubmission, {
          headers: {
            Authorization: meterReplacementAuthData.invalidBearerToken,
          },
          data: {},
        }),
      );
      const responseBody = await safeResponseJson(rawResponse);

      validation.execute("Unauthorized envelope", () =>
        MeterReplacementCommonValidator.validateUnauthorizedError(
          rawResponse.status(),
          responseBody,
        ),
      );

      validation.printSummary("Create Submission — Auth Codes", 0);
    },
  );
});
