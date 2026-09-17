import type { APIResponse } from "@playwright/test";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { AuditLogsApi } from "../Api/auditlogs.api";
import { auditLogsMaxResponseTimeMs } from "../Data/auditlogs.data";
import {
  AuditLogsMapper,
  type AuditLogsQuery,
} from "../Mapper/auditlogs.mapper";
import { AuditLogsValidator } from "../Validator/auditlogs.validator";

export async function runAuditLogsValidation(options: {
  api: AuditLogsApi;
  query: AuditLogsQuery;
  testLabel: string;
  sortDirection: "desc" | "asc";
  requireLogs?: boolean;
  expectedAction?: string;
}): Promise<{
  rawResponse: APIResponse;
  responseTime: number;
  data: ReturnType<typeof AuditLogsMapper.mapData>;
}> {
  const {
    api,
    query,
    testLabel,
    sortDirection,
    requireLogs = true,
    expectedAction,
  } = options;

  const { rawResponse, responseBody, responseTime } =
    await api.getAuditLogs(query);

  await PerformanceTracker.track(
    rawResponse,
    testLabel,
    rawResponse.url(),
    responseTime,
  );

  const assert = new AssertionEngine();
  const validation = new ValidationEngine();
  const validator = new AuditLogsValidator();
  const mapped = AuditLogsMapper.mapData(responseBody.data);

  validation.execute("Status", () => assert.validateStatusCode(rawResponse, 200));
  validation.execute("Content", () => assert.validateContentType(rawResponse));
  validation.execute("Response Time", () =>
    assert.validateResponseTime(responseTime, auditLogsMaxResponseTimeMs),
  );
  validation.execute("Security", () =>
    assert.validateSensitiveData(responseBody),
  );
  validation.execute("Response Contract", () =>
    validator.validateResponse(responseBody),
  );
  validation.execute("Columns", () => validator.validateColumns(mapped));
  if (requireLogs) {
    validation.execute("Logs Exist", () =>
      validator.validateAuditLogsExist(mapped),
    );
  }
  validation.execute("Pagination", () => validator.validatePagination(mapped));
  validation.execute("Query Params", () =>
    validator.validateQueryParams(mapped, query),
  );
  validation.execute("Audit Log Fields", () =>
    validator.validateAuditLogFields(mapped),
  );
  validation.execute("UUID Fields", () => validator.validateUuidFields(mapped));
  validation.execute("Emails", () => validator.validateEmails(mapped));
  validation.execute("Roles", () => validator.validateRoles(mapped));
  validation.execute("Full Names", () => validator.validateFullNames(mapped));
  validation.execute("Actions", () => validator.validateActions(mapped));
  if (expectedAction) {
    validation.execute("Action Filter", () =>
      validator.validateActionFilter(mapped, expectedAction),
    );
  }
  validation.execute("IP Addresses", () =>
    validator.validateIpAddresses(mapped),
  );
  validation.execute("Details", () => validator.validateDetails(mapped));
  validation.execute("Created At", () => validator.validateCreatedAt(mapped));
  validation.execute("Unique IDs", () => validator.validateUniqueIds(mapped));
  validation.execute("Next Cursor", () => validator.validateNextCursor(mapped));
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
  if (sortDirection === "desc") {
    validation.execute("Descending Sort", () =>
      validator.validateDescendingSort(mapped),
    );
  } else {
    validation.execute("Ascending Sort", () =>
      validator.validateAscendingSort(mapped),
    );
  }

  validation.printSummary(testLabel, responseTime);
  return { rawResponse, responseTime, data: mapped };
}
