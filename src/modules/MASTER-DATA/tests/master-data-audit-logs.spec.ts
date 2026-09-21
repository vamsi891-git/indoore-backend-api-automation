import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { PerformanceTracker } from "../../../core/utils/performance.tracker";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { MasterDataAuditLogsApi } from "../Api/master-data-audit-logs.api";
import {
  masterDataAuditLogsMaxResponseTimeMs,
  masterDataAuditLogsTestCases,
} from "../Data/master-data-audit-logs.data";
import { MasterDataAuditLogsMapper } from "../Mapper/master-data-audit-logs.mapper";
import { MasterDataAuditLogsValidator } from "../Validator/master-data-audit-logs.validator";
import { MasterDataCommonValidator } from "../Validator/master-data-common.validator";
import { MasterDataAuditLogsSuccessResponseSchema } from "../schemas/master-data.schemas";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

test.describe("Master data — change history", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  for (const testCase of masterDataAuditLogsTestCases) {
    test(testCase.testName, { tag: testCase.tags }, async ({ authenticatedApi }) => {
      const expectedStatus = testCase.expectedStatus ?? 200;
      const api = new MasterDataAuditLogsApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } = await api.getAuditLogs(testCase.query);

      await PerformanceTracker.track(
        rawResponse,
        testCase.testName,
        rawResponse.url(),
        responseTime,
      );

      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const validator = new MasterDataAuditLogsValidator();

      validation.execute("Status Validation", () =>
        assert.validateStatusCode(rawResponse, expectedStatus, responseBody),
      );
      validation.execute("Content Type", () => assert.validateContentType(rawResponse));
      validation.execute("Response Time", () =>
        assert.validateResponseTime(responseTime, masterDataAuditLogsMaxResponseTimeMs),
      );
      validation.execute("Sensitive Data", () => assert.validateSensitiveData(responseBody));

      if (expectedStatus === 400) {
        validation.execute("Validation Error", () =>
          validator.validateValidationError(responseBody),
        );
        validation.printSummary(testCase.testName, responseTime);
        return;
      }

      validation.execute("Zod Response Schema", () =>
        MasterDataCommonValidator.validateZodResponseSchema(
          responseBody,
          MasterDataAuditLogsSuccessResponseSchema,
        ),
      );
      validation.execute("Response Envelope", () => validator.validateResponse(responseBody));

      const mapped = MasterDataAuditLogsMapper.mapData(responseBody.data);

      validation.execute("Live Validations", () =>
        validator.validateLiveOk(mapped, testCase.query, testCase.sortDirection),
      );

      if (testCase.scenario === "filter_action" && testCase.query.action) {
        validation.execute("Exact Action Filter", () =>
          validator.validateExactActionFilter(mapped, testCase.query.action!),
        );
      }

      if (testCase.scenario === "filter_prefix" && testCase.query.actionPrefix) {
        validation.execute("Action Prefix Filter", () =>
          validator.validateActionPrefixFilter(mapped, testCase.query.actionPrefix!),
        );
      }

      // Soft assert success flag for observability summary
      expect(responseBody.success).toBeTruthy();
      validation.printSummary(testCase.testName, responseTime);
    });
  }
});
