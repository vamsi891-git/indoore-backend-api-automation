import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { test as authTest } from "../../../fixtures/auth.fixture";
import { ProgressApi } from "../Api/progress.api";
import { progressData } from "../Data/progress.data";
import { ProgressMapper } from "../Mapper/progress.mapper";
import { ProgressValidator } from "../Validator/progress.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import {
  pauseMs,
  withRateLimitRetry,
} from "../utils/response.helper";

test.describe("Meter Replacement Progress API — Negative & Edge", () => {
  test(
    "Ignored query params still return progress charts",
    {
      tag: [
        "@meter-replacement",
        "@progress",
        "@edge",
      ],
    },
    async ({ authenticatedApi }) => {
      const api = new ProgressApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new ProgressValidator();

      const { rawResponse, responseBody, responseTime } =
        await api.getProgress(progressData.ignoredQueryParams);

      await PerformanceTracker.track(
        rawResponse,
        "Meter Replacement Progress API — Query Pollution",
        rawResponse.url(),
        responseTime,
      );

      validation.execute("Status Code", () =>
        assert.validateStatusCode(rawResponse, 200, responseBody),
      );

      validation.execute("Success Envelope", () =>
        validator.validateSuccessEnvelopePreserved(responseBody),
      );

      const mapped = ProgressMapper.map(responseBody);

      validation.execute("Weekly Labels Intact", () =>
        validator.validateWeeklyLabels(mapped.weekly),
      );

      validation.execute("Monthly Labels Intact", () =>
        validator.validateMonthlyLabels(mapped.monthly),
      );

      validation.printSummary(
        "Meter Replacement Progress API — Query Pollution",
        responseTime,
      );
    },
  );

  test(
    "Injection-like query params do not break progress",
    {
      tag: [
        "@meter-replacement",
        "@progress",
        "@edge",
        "@security",
      ],
    },
    async ({ authenticatedApi }) => {
      const api = new ProgressApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new ProgressValidator();

      const payloads = [
        progressData.sqlInjectionQuery,
        progressData.xssQuery,
        progressData.unicodeQuery,
        progressData.emojiQuery,
        progressData.whitespaceQuery,
        progressData.emptyQuery,
        progressData.longQuery,
      ];

      for (const payload of payloads) {
        const { rawResponse, responseBody, responseTime } =
          await api.getProgress({ q: payload, search: payload });

        validation.execute(`Status (${payload.slice(0, 12)})`, () =>
          assert.validateStatusCode(rawResponse, 200, responseBody),
        );

        validation.execute(`Envelope (${payload.slice(0, 12)})`, () =>
          validator.validateSuccessEnvelopePreserved(responseBody),
        );

        const mapped = ProgressMapper.map(responseBody);

        validation.execute(`Weekly (${payload.slice(0, 12)})`, () =>
          validator.validateWeeklyBucketCount(mapped.weekly),
        );

        validation.execute(`Monthly (${payload.slice(0, 12)})`, () =>
          validator.validateMonthlyBucketCount(mapped.monthly),
        );

        await PerformanceTracker.track(
          rawResponse,
          `Meter Replacement Progress API — Injection ${payload.slice(0, 12)}`,
          rawResponse.url(),
          responseTime,
        );
      }

      validation.printSummary(
        "Meter Replacement Progress API — Injection Queries",
        0,
      );
    },
  );

  test(
    "Trailing slash still returns progress charts",
    {
      tag: [
        "@meter-replacement",
        "@progress",
        "@edge",
      ],
    },
    async ({ authenticatedApi }) => {
      const api = new ProgressApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new ProgressValidator();

      const { rawResponse, responseBody, responseTime } =
        await api.getProgressWithTrailingSlash();

      validation.execute("Status Code", () =>
        assert.validateStatusCode(rawResponse, 200, responseBody),
      );

      validation.execute("Success Envelope", () =>
        validator.validateSuccessEnvelopePreserved(responseBody),
      );

      const mapped = ProgressMapper.map(responseBody);

      validation.execute("Weekly Bucket Count", () =>
        validator.validateWeeklyBucketCount(mapped.weekly),
      );

      validation.execute("Monthly Bucket Count", () =>
        validator.validateMonthlyBucketCount(mapped.monthly),
      );

      validation.printSummary(
        "Meter Replacement Progress API — Trailing Slash",
        responseTime,
      );
    },
  );

});

authTest.describe("Meter Replacement Progress API — Auth Negative", () => {
  authTest(
    "Missing Authorization returns 401",
    {
      tag: [
        "@meter-replacement",
        "@progress",
        "@negative",
        "@auth",
      ],
    },
    async ({ unauthenticatedApi }) => {
      const validation = new ValidationEngine();
      const validator = new ProgressValidator();

      const rawResponse = await withRateLimitRetry(() =>
        unauthenticatedApi.get("/indore/meter-replacement/progress"),
      );
      const responseBody = await rawResponse.json().catch(() => ({}));

      validation.execute("Unauthorized Error", () =>
        validator.validateUnauthorizedError(
          rawResponse.status(),
          responseBody,
        ),
      );

      validation.printSummary(
        "Meter Replacement Progress API — Missing Auth",
        0,
      );
    },
  );

  authTest(
    "Invalid Bearer token returns 401",
    {
      tag: [
        "@meter-replacement",
        "@progress",
        "@negative",
        "@auth",
      ],
    },
    async ({ unauthenticatedApi }) => {
      const validation = new ValidationEngine();
      const validator = new ProgressValidator();

      const cases = [
        progressData.invalidBearerToken,
        progressData.malformedBearerToken,
        progressData.emptyBearerToken,
      ];

      for (const authorization of cases) {
        const rawResponse = await withRateLimitRetry(() =>
          unauthenticatedApi.get("/indore/meter-replacement/progress", {
            headers: {
              Authorization: authorization,
            },
          }),
        );
        const responseBody = await rawResponse.json().catch(() => ({}));

        validation.execute(`Unauthorized (${authorization.slice(0, 20)})`, () =>
          validator.validateUnauthorizedError(
            rawResponse.status(),
            responseBody,
          ),
        );

        await pauseMs(400);
      }

      validation.printSummary(
        "Meter Replacement Progress API — Invalid Auth",
        0,
      );
    },
  );

  authTest(
    "Disallowed HTTP methods are rejected",
    {
      tag: [
        "@meter-replacement",
        "@progress",
        "@negative",
      ],
    },
    async ({ unauthenticatedApi }) => {
      const validation = new ValidationEngine();
      const validator = new ProgressValidator();

      const callers: Record<
        string,
        () => Promise<import("@playwright/test").APIResponse>
      > = {
        POST: () =>
          withRateLimitRetry(() =>
            unauthenticatedApi.post("/indore/meter-replacement/progress", {
              data: {},
            }),
          ),
        PUT: () =>
          withRateLimitRetry(() =>
            unauthenticatedApi.put("/indore/meter-replacement/progress", {
              data: {},
            }),
          ),
        PATCH: () =>
          withRateLimitRetry(() =>
            unauthenticatedApi.patch("/indore/meter-replacement/progress", {
              data: {},
            }),
          ),
        DELETE: () =>
          withRateLimitRetry(() =>
            unauthenticatedApi.delete("/indore/meter-replacement/progress"),
          ),
      };

      for (const method of progressData.disallowedMethods) {
        const rawResponse = await callers[method]();
        const responseBody = await rawResponse.json().catch(() => ({}));

        validation.execute(`${method} status`, () =>
          validator.validateDisallowedMethodRejected(rawResponse.status()),
        );

        validation.execute(`${method} not success chart`, () => {
          expect(responseBody?.data?.weekly).toBeUndefined();
        });

        await pauseMs(300);
      }

      validation.printSummary(
        "Meter Replacement Progress API — Disallowed Methods",
        0,
      );
    },
  );
});
