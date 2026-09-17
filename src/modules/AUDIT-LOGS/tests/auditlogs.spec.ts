import { test } from "../../../fixtures/api.fixture";
import { AuditLogsApi } from "../Api/auditlogs.api";
import {
  auditLogsDefaultQuery,
  auditLogsTestCases,
} from "../Data/auditlogs.data";
import { runAuditLogsValidation } from "./auditlogs.harness";

test.describe("Audit Logs API", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(120_000);

  let nextCursor: string | null = null;
  let sampleAction: string | undefined;

  for (const testCase of auditLogsTestCases) {
    test(
      testCase.testName,
      { tag: testCase.tags },
      async ({ authenticatedApi }) => {
        const result = await runAuditLogsValidation({
          api: new AuditLogsApi(authenticatedApi),
          query: testCase.query,
          testLabel: testCase.testName,
          sortDirection: testCase.sortDirection,
          requireLogs: testCase.requireLogs ?? true,
        });

        if (testCase.query.page === auditLogsDefaultQuery.page) {
          nextCursor = result.data.nextCursor;
          sampleAction = result.data.logs[0]?.action;
        }
      },
    );
  }

  test(
    "GET /users/audit-logs — action filter",
    { tag: ["@smoke", "@audit-logs"] },
    async ({ authenticatedApi }) => {
      if (!sampleAction) {
        test.skip(true, "No audit log action from the default page");
        return;
      }
      await runAuditLogsValidation({
        api: new AuditLogsApi(authenticatedApi),
        query: { ...auditLogsDefaultQuery, action: sampleAction },
        testLabel: "Audit Logs — action filter",
        sortDirection: "desc",
        expectedAction: sampleAction,
      });
    },
  );

  test(
    "GET /users/audit-logs — cursor from page 1",
    { tag: ["@smoke", "@audit-logs"] },
    async ({ authenticatedApi }) => {
      if (!nextCursor) {
        test.skip(true, "No nextCursor from the default page");
        return;
      }
      await runAuditLogsValidation({
        api: new AuditLogsApi(authenticatedApi),
        query: { ...auditLogsDefaultQuery, cursor: nextCursor },
        testLabel: "Audit Logs — cursor",
        sortDirection: "desc",
        requireLogs: false,
      });
    },
  );

  test(
    "GET /users/audit-logs — unknown action returns empty page",
    { tag: ["@smoke", "@audit-logs"] },
    async ({ authenticatedApi }) => {
      const { data } = await runAuditLogsValidation({
        api: new AuditLogsApi(authenticatedApi),
        query: {
          ...auditLogsDefaultQuery,
          action: "audit.__no_such_action__",
        },
        testLabel: "Audit Logs — unknown action",
        sortDirection: "desc",
        requireLogs: false,
      });
      if (data.logs.length > 0) {
        throw new Error("Expected no logs for an unknown action filter");
      }
    },
  );
});
