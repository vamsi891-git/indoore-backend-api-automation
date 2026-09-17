import { test } from "../../../../src/fixtures/api.fixture";
import { AuditLogExportApi } from "../Api/auditlogexport.api";
import { AuditLogExportTestData } from "../Data/auditlogexport.data";
import { AuditLogExportValidator } from "../Validator/auditlogexport.validator";
import { CsvParser } from "../Utils/csv.parser";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../../src/core/utils/performancetracker";

function skipIfExportNotDeployed(status: number, body: string): void {
  if (status === 404) {
    test.skip(
      true,
      `GET /users/audit-logs/export is not on this backend (${body.slice(0, 120)})`,
    );
  }
}

test.describe("Audit Log Export API", () => {
  test.describe.configure({ mode: "serial", retries: 0 });
  test.setTimeout(240_000);

  test(
    "GET /users/audit-logs/export — createdAt_asc",
    { tag: ["@smoke", "@audit-logs", "@export"] },
    async ({ authenticatedApi }) => {
      const api = new AuditLogExportApi(authenticatedApi);
      const { rawResponse, csvContent, responseTime } =
        await api.exportAuditLogs(
          AuditLogExportTestData.limit,
          AuditLogExportTestData.ascSort,
        );
      skipIfExportNotDeployed(rawResponse.status(), csvContent);

      await PerformanceTracker.track(
        rawResponse,
        "Audit Log Export ASC",
        rawResponse.url(),
        responseTime,
      );

      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new AuditLogExportValidator();
      const rows = CsvParser.parseAuditLogCsv(csvContent);
      const headers = rawResponse.headers();

      validation.execute("Status", () =>
        assert.validateStatusCode(rawResponse, 200, csvContent.slice(0, 300)),
      );
      validation.execute("Content", () =>
        assert.validateContentType(rawResponse, "text/csv"),
      );
      validation.execute("Download Headers", () =>
        validator.validateDownloadHeaders(
          headers["content-type"],
          headers["content-disposition"],
        ),
      );
      validation.execute("Response Time", () =>
        assert.validateResponseTime(
          responseTime,
          AuditLogExportTestData.maxResponseTimeMs,
        ),
      );
      validation.execute("CSV Body", () =>
        validator.validateNotJsonError(csvContent),
      );
      validation.execute("File", () => validator.validateFileNotEmpty(csvContent));
      validation.execute("Columns", () => validator.validateHeaders(csvContent));
      validation.execute("Row Count", () =>
        validator.validateRowCount(rows, AuditLogExportTestData.limit),
      );
      validation.execute("Rows", () => validator.validateAuditRows(rows));
      validation.execute("UUIDs", () => validator.validateUUIDs(rows));
      validation.execute("Emails", () => validator.validateEmails(rows));
      validation.execute("Roles", () => validator.validateRoles(rows));
      validation.execute("Full Names", () => validator.validateFullNames(rows));
      validation.execute("Actions", () => validator.validateActions(rows));
      validation.execute("Created At", () => validator.validateCreatedAt(rows));
      validation.execute("IP Addresses", () =>
        validator.validateIpAddresses(rows),
      );
      validation.execute("Details", () => validator.validateDetails(rows));
      validation.execute("Duplicate IDs", () =>
        validator.validateDuplicateIds(rows),
      );
      validation.execute("Target Consistency", () =>
        validator.validateTargetConsistency(rows),
      );
      validation.execute("Ascending Sort", () =>
        validator.validateAscendingSort(rows),
      );
      validation.execute("No Data", () =>
        validator.validateNoDataScenario(rows),
      );

      validation.printSummary("Audit Log Export ASC", responseTime);
    },
  );

  test(
    "GET /users/audit-logs/export — createdAt_desc",
    { tag: ["@smoke", "@audit-logs", "@export"] },
    async ({ authenticatedApi }) => {
      const api = new AuditLogExportApi(authenticatedApi);
      const { rawResponse, csvContent, responseTime } =
        await api.exportAuditLogs(
          AuditLogExportTestData.limit,
          AuditLogExportTestData.descSort,
        );
      skipIfExportNotDeployed(rawResponse.status(), csvContent);

      await PerformanceTracker.track(
        rawResponse,
        "Audit Log Export DESC",
        rawResponse.url(),
        responseTime,
      );

      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new AuditLogExportValidator();
      const rows = CsvParser.parseAuditLogCsv(csvContent);
      const headers = rawResponse.headers();

      validation.execute("Status", () =>
        assert.validateStatusCode(rawResponse, 200, csvContent.slice(0, 300)),
      );
      validation.execute("Content", () =>
        assert.validateContentType(rawResponse, "text/csv"),
      );
      validation.execute("Download Headers", () =>
        validator.validateDownloadHeaders(
          headers["content-type"],
          headers["content-disposition"],
        ),
      );
      validation.execute("Response Time", () =>
        assert.validateResponseTime(
          responseTime,
          AuditLogExportTestData.maxResponseTimeMs,
        ),
      );
      validation.execute("CSV Body", () =>
        validator.validateNotJsonError(csvContent),
      );
      validation.execute("File", () => validator.validateFileNotEmpty(csvContent));
      validation.execute("Columns", () => validator.validateHeaders(csvContent));
      validation.execute("Row Count", () =>
        validator.validateRowCount(rows, AuditLogExportTestData.limit),
      );
      validation.execute("Created At", () => validator.validateCreatedAt(rows));
      validation.execute("Duplicate IDs", () =>
        validator.validateDuplicateIds(rows),
      );
      validation.execute("Descending Sort", () =>
        validator.validateDescendingSort(rows),
      );

      validation.printSummary("Audit Log Export DESC", responseTime);
    },
  );
});
