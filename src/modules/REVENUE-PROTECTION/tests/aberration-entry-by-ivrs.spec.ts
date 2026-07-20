import { test } from "../../../fixtures/observability.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { assertZodSchema } from "../../../core/utils/zod-validation.helper";
import { REVENUE_PROTECTION_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { applyAllureTestCaseId } from "../../../core/utils/allure-test-case.helper";
import { AberrationEntryApi } from "../Api/aberration-entry.api";
import {
  aberrationEntryByIvrsMaxResponseTimeMs,
  aberrationEntryByIvrsTestCases,
  buildAberrationEntryUpdatePayload,
} from "../Data/aberration-entry-by-ivrs.data";
import { AberrationEntryByIvrsMapper } from "../Mapper/aberration-entry-by-ivrs.mapper";
import { AberrationEntryByIvrsValidator } from "../Validator/aberration-entry-by-ivrs.validator";
import { AberrationEntryByIvrsSuccessResponseSchema } from "../schemas/aberration-entry-by-ivrs.schemas";
import { resolveAberrationEntryIvrsForUpdate } from "../utils/aberration-entry-by-ivrs.helper";

test.describe("Revenue Protection — Aberration Entry By IVRS (PATCH)", () => {
  test.describe.configure({
    retries: 1,
    mode: "serial",
  });

  test.setTimeout(REVENUE_PROTECTION_TEST_TIMEOUT_MS);

  for (const testCase of aberrationEntryByIvrsTestCases) {
    test(
      testCase.testName,
      { tag: [...testCase.tags] },
      async ({ authenticatedApi, obs }) => {
        await applyAllureTestCaseId(testCase.testCaseId);

        const ivrsNo = await resolveAberrationEntryIvrsForUpdate(authenticatedApi);
        const api = new AberrationEntryApi(authenticatedApi);
        const payload = buildAberrationEntryUpdatePayload({
          remarks: `automation ${testCase.testCaseId}`,
        });

        const { rawResponse, responseBody, responseTime } =
          await api.patchAberrationEntryByIvrs(ivrsNo, payload);

        await PerformanceTracker.track(
          rawResponse,
          testCase.testName,
          rawResponse.url(),
          responseTime,
        );

        const assert = new AssertionEngine();
        const validation = new ValidationEngine(obs);
        const validator = new AberrationEntryByIvrsValidator();
        const mapped = AberrationEntryByIvrsMapper.mapData(responseBody.data);

        validation.execute("Status Validation", () =>
          assert.validateStatusCode(rawResponse, 200, responseBody),
        );
        validation.execute("Content Validation", () =>
          assert.validateContentType(rawResponse),
        );
        validation.execute("Response Time", () =>
          assert.validateResponseTime(
            responseTime,
            aberrationEntryByIvrsMaxResponseTimeMs,
          ),
        );
        validation.execute("Security Validation", () =>
          assert.validateSensitiveData(responseBody),
        );
        validation.execute("Required Fields", () =>
          assert.validateRequiredFields(responseBody, ["success", "data"]),
        );
        validation.execute("Schema Validation", () =>
          assertZodSchema(AberrationEntryByIvrsSuccessResponseSchema, responseBody),
        );
        validation.execute("Response", () => validator.validateResponse(responseBody));
        validation.execute("IVRS Echo", () =>
          validator.validateIvrsEcho(mapped, ivrsNo),
        );

        validation.printSummary(testCase.testName, responseTime);
      },
    );
  }

  test(
    "IND-REV-ABE-IVRS-002 — PATCH with p4Number alias also succeeds",
    {
      tag: ["@revenue-protection", "@aberration-entry-by-ivrs", "@positive"],
    },
    async ({ authenticatedApi, obs }) => {
      await applyAllureTestCaseId("IND-REV-ABE-IVRS-002");

      const ivrsNo = await resolveAberrationEntryIvrsForUpdate(authenticatedApi);
      const api = new AberrationEntryApi(authenticatedApi);
      const payload = buildAberrationEntryUpdatePayload({
        p4No: undefined,
        p4Number: "AUTO-P4-002",
        p4Date: "20-07-2026",
      });

      const { rawResponse, responseBody, responseTime } =
        await api.patchAberrationEntryByIvrs(ivrsNo, payload);

      const assert = new AssertionEngine();
      const validation = new ValidationEngine(obs);
      const validator = new AberrationEntryByIvrsValidator();
      const mapped = AberrationEntryByIvrsMapper.mapData(responseBody.data);

      validation.execute("Status Validation", () =>
        assert.validateStatusCode(rawResponse, 200, responseBody),
      );
      validation.execute("Schema Validation", () =>
        assertZodSchema(AberrationEntryByIvrsSuccessResponseSchema, responseBody),
      );
      validation.execute("IVRS Echo", () =>
        validator.validateIvrsEcho(mapped, ivrsNo),
      );
      validation.printSummary("By IVRS — p4Number alias", responseTime);
    },
  );
});
