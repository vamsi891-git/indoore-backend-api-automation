import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { AuditLogsApi } from "../Api/auditlogs.api";
import {
  auditLogsMaxResponseTimeMs,
  auditLogsTestCases,
} from "../Data/auditlogs.data";
import { AuditLogsMapper } from "../Mapper/auditlogs.mapper";
import { AuditLogsValidator } from "../Validator/auditlogs.validator";

test.describe("Audit Logs API", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(120_000);

  for (const testCase of auditLogsTestCases) {
    test(
      testCase.testName,
      { tag: testCase.tags },
      async ({ authenticatedApi }) => {
        const api = new AuditLogsApi(authenticatedApi);
        const { rawResponse, responseBody, responseTime } =
          await api.getAuditLogs(testCase.query);

        const params = new URLSearchParams();
        params.set("page", String(testCase.query.page ?? 1));
        params.set("limit", String(testCase.query.limit ?? 20));
        params.set("sort", testCase.query.sort ?? "createdAt_desc");

        await PerformanceTracker.track(
          rawResponse,
          testCase.testName,
          `${process.env.BASE_URL}/indore/users/audit-logs?${params}`,
          responseTime,
        );

        const assert = new AssertionEngine();
        const validation = new ValidationEngine();
        const validator = new AuditLogsValidator();
        const mapped = AuditLogsMapper.mapData(responseBody.data);

        validation.execute("Status Validation", () =>
          assert.validateStatusCode(rawResponse, 200),
        );
        validation.execute("Content Validation", () =>
          assert.validateContentType(rawResponse),
        );
        validation.execute("Response Time", () =>
          assert.validateResponseTime(
            responseTime,
            auditLogsMaxResponseTimeMs,
          ),
        );
        validation.execute("Security Validation", () =>
          assert.validateSensitiveData(responseBody),
        );
        validation.execute("Required Fields", () =>
          assert.validateRequiredFields(responseBody, ["success", "data"]),
        );
        validation.execute("Response", () =>
          validator.validateResponse(responseBody),
        );
        validation.execute("Logs Exist", () =>
          validator.validateAuditLogsExist(mapped),
        );
        validation.execute("Pagination", () =>
          validator.validatePagination(mapped),
        );
        validation.execute("Query Params", () =>
          validator.validateQueryParams(mapped, testCase.query),
        );
        validation.execute("Audit Log Fields", () =>
          validator.validateAuditLogFields(mapped),
        );
        validation.execute("UUID Fields", () =>
          validator.validateUuidFields(mapped),
        );
        validation.execute("Emails", () => validator.validateEmails(mapped));
        validation.execute("Roles", () => validator.validateRoles(mapped));
        validation.execute("Full Names", () =>
          validator.validateFullNames(mapped),
        );
        validation.execute("Actions", () => validator.validateActions(mapped));
        validation.execute("IP Addresses", () =>
          validator.validateIpAddresses(mapped),
        );
        validation.execute("Details", () => validator.validateDetails(mapped));
        validation.execute("Created At", () =>
          validator.validateCreatedAt(mapped),
        );
        validation.execute("Unique IDs", () =>
          validator.validateUniqueIds(mapped),
        );
        validation.execute("Next Cursor", () =>
          validator.validateNextCursor(mapped),
        );
        validation.execute("Action Filter Options", () =>
          validator.validateActionFilterOptions(mapped),
        );
        validation.execute("Log Actions In Filter Options", () =>
          validator.validateLogActionsInFilterOptions(mapped),
        );
        validation.execute("Display Labels", () =>
          validator.validateDisplayLabels(mapped),
        );
        validation.execute("Actor Label Matches Name", () =>
          validator.validateActorLabelMatchesName(mapped),
        );
        validation.execute("No Data Scenario", () =>
          validator.validateNoDataScenario(mapped),
        );

        if (testCase.sortDirection === "desc") {
          validation.execute("Descending Sort", () =>
            validator.validateDescendingSort(mapped),
          );
        } else {
          validation.execute("Ascending Sort", () =>
            validator.validateAscendingSort(mapped),
          );
        }

        validation.printSummary(testCase.testName, responseTime);
      },
    );
  }
});
