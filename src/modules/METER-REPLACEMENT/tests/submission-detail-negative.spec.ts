import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { test as authTest } from "../../../fixtures/auth.fixture";
import { SubmissionDetailApi } from "../Api/submission-detail.api";
import { submissionDetailData } from "../Data/submission-detail.data";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import {
  MeterReplacementCommonValidator,
  meterReplacementAuthData,
  meterReplacementPaths,
} from "../Validator/meter-replacement-common.validator";
import { pauseMs } from "../utils/response.helper";

test.describe("Meter Replacement Submission Detail API — Negative & Edge", () => {
  test(
    "Unknown submission returns 404 SUBMISSION_NOT_FOUND",
    {
      tag: ["@meter-replacement", "@submission-detail", "@negative"],
    },
    async ({ authenticatedApi }) => {
      const api = new SubmissionDetailApi(authenticatedApi);
      const validation = new ValidationEngine();

      const { rawResponse, responseBody } = await api.getSubmissionDetail(
        submissionDetailData.invalidSubmissionId,
      );

      validation.execute("Status", () => {
        expect(rawResponse.status()).toBe(404);
      });

      validation.execute("Error envelope", () =>
        MeterReplacementCommonValidator.validateErrorEnvelope(
          responseBody,
          ["SUBMISSION_NOT_FOUND"],
        ),
      );

      validation.printSummary("Submission Detail — Not Found", 0);
    },
  );

  test(
    "Invalid submission ids return validation or not-found",
    {
      tag: ["@meter-replacement", "@submission-detail", "@negative"],
    },
    async ({ authenticatedApi }) => {
      const api = new SubmissionDetailApi(authenticatedApi);
      const validation = new ValidationEngine();

      const cases: Array<number | string> = [
        submissionDetailData.zeroSubmissionId,
        submissionDetailData.negativeSubmissionId,
        submissionDetailData.decimalSubmissionId,
        submissionDetailData.alphaSubmissionId,
        submissionDetailData.alphaNumericSubmissionId,
        submissionDetailData.specialCharacterId,
        submissionDetailData.sqlInjectionId,
        submissionDetailData.xssInjectionId,
        submissionDetailData.unicodeId,
        submissionDetailData.emojiId,
        submissionDetailData.whitespaceId,
      ];

      for (const submissionId of cases) {
        const { rawResponse, responseBody } =
          await api.getSubmissionDetail(submissionId);

        validation.execute(
          `Status (${String(submissionId).slice(0, 16)})`,
          () =>
            MeterReplacementCommonValidator.validateClientOrNotFound(
              rawResponse.status(),
            ),
        );

        validation.execute(
          `Error (${String(submissionId).slice(0, 16)})`,
          () => {
            expect(responseBody.success).toBeFalsy();
          },
        );

        await pauseMs(250);
      }

      validation.printSummary("Submission Detail — Invalid IDs", 0);
    },
  );

  test(
    "Boundary integer submission ids do not 500",
    {
      tag: ["@meter-replacement", "@submission-detail", "@edge"],
    },
    async ({ authenticatedApi }) => {
      const api = new SubmissionDetailApi(authenticatedApi);
      const validation = new ValidationEngine();

      for (const submissionId of [
        submissionDetailData.maximumSubmissionId,
        submissionDetailData.minimumSubmissionId,
      ]) {
        const { rawResponse, responseBody } =
          await api.getSubmissionDetail(submissionId);

        validation.execute(`Status (${submissionId})`, () => {
          expect(rawResponse.status()).toBeLessThan(500);
        });

        validation.execute(`Handled (${submissionId})`, () => {
          expect(
            rawResponse.status() === 200 || responseBody.success === false,
          ).toBeTruthy();
        });
      }

      validation.printSummary("Submission Detail — Boundary IDs", 0);
    },
  );

  test(
    "Valid submission returns success envelope",
    {
      tag: ["@meter-replacement", "@submission-detail", "@edge"],
    },
    async ({ authenticatedApi }) => {
      const api = new SubmissionDetailApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();

      const { rawResponse, responseBody } = await api.getSubmissionDetail(
        submissionDetailData.submissionId,
      );

      validation.execute("Status", () =>
        assert.validateStatusCode(rawResponse, 200, responseBody),
      );
      validation.execute("Success", () => {
        expect(responseBody.success).toBeTruthy();
        expect(responseBody.data).toBeDefined();
      });

      validation.printSummary("Submission Detail — Valid Sanity", 0);
    },
  );
});

authTest.describe("Meter Replacement Submission Detail API — Auth Negative", () => {
  authTest(
    "Missing Authorization returns 401",
    {
      tag: ["@meter-replacement", "@submission-detail", "@negative", "@auth"],
    },
    async ({ unauthenticatedApi }) => {
      const validation = new ValidationEngine();
      const rawResponse =
        await MeterReplacementCommonValidator.getUnauthenticated(
          unauthenticatedApi,
          meterReplacementPaths.submissionDetail(
            submissionDetailData.submissionId,
          ),
        );
      const body = await rawResponse.json().catch(() => ({}));

      validation.execute("Unauthorized", () =>
        MeterReplacementCommonValidator.validateUnauthorizedError(
          rawResponse.status(),
          body,
        ),
      );
      validation.printSummary("Submission Detail — Missing Auth", 0);
    },
  );

  authTest(
    "Invalid Bearer token returns 401",
    {
      tag: ["@meter-replacement", "@submission-detail", "@negative", "@auth"],
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
            meterReplacementPaths.submissionDetail(
              submissionDetailData.submissionId,
            ),
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

      validation.printSummary("Submission Detail — Invalid Auth", 0);
    },
  );

  authTest(
    "Disallowed HTTP methods are rejected",
    {
      tag: ["@meter-replacement", "@submission-detail", "@negative"],
    },
    async ({ unauthenticatedApi }) => {
      const validation = new ValidationEngine();
      const callers =
        MeterReplacementCommonValidator.getDisallowedMethodCallers(
          unauthenticatedApi,
          meterReplacementPaths.submissionDetail(
            submissionDetailData.submissionId,
          ),
        );

      for (const method of meterReplacementAuthData.disallowedMethods) {
        const rawResponse = await callers[method]();
        validation.execute(`${method} status`, () =>
          MeterReplacementCommonValidator.validateDisallowedMethodRejected(
            rawResponse.status(),
          ),
        );
      }

      validation.printSummary("Submission Detail — Disallowed Methods", 0);
    },
  );
});
