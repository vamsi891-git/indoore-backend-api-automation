import type { TestInfo } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { HourlyLossReportApi } from "../Api/hourly-loss-report.api";
import { HourlyLossReportQuery } from "../Mapper/hourly-loss-report.mapper";
import { getHourlyLossReportPaginatedView } from "../Mapper/hourly-loss-report.mapper";
import { HourlyLossReportValidator } from "../Validator/hourly-loss-report.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

export function registerHourlyLossReportTest(
  label: string,
  buildQuery: () => HourlyLossReportQuery,
): void {
  test(`Validate ${label} hourly loss report`,
    {
      tag: ["@smoke", "@energy-audit", "@hourly-loss-report", `@${label}`],
    },
    async ({ authenticatedApi }, testInfo: TestInfo) => {
      const query = buildQuery();
      const api = new HourlyLossReportApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } =
        await api.getHourlyLossReport(query);
      const view = getHourlyLossReportPaginatedView(responseBody, query);
      const hasRows = view.totalCount > 0;

      const defectContext = {
        module: "ENERGY-AUDITS",
        endpoint: rawResponse.url(),
        requestParams: query,
        responseStatus: rawResponse.status(),
        responseBody,
        expectedBehavior:
          "Hourly loss grid with H1..H24 buckets, total = sum(hours), pagination; empty dataset returns total=0.",
      };
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new HourlyLossReportValidator();
      try {
        ApiValidationHelper.runStandardChecks(validation, assert, {
          apiName: `Energy Audit Hourly Loss Report (${label})`,
          rawResponse,
          responseBody,
          responseTime,
          maxResponseTimeMs: 180000,
        });

        validation.execute("Response Contract", () =>
          validator.validateResponse(responseBody),
        );
        validation.execute("Columns Contract", () =>
          validator.validateColumns(view),
        );
        validation.execute("Pagination", () =>
          validator.validatePagination(view, query),
        );
        validation.execute("Total Count", () =>
          validator.validateTotalCount(view),
        );

        if (hasRows) {
          validation.execute("Rows Exist", () =>
            validator.validateRowsExist(view),
          );
        } else {
          validation.execute("No Data Scenario", () =>
            validator.validateNoDataScenario(view),
          );
        }

        if (view.rows.length > 0) {
          validation.execute("Row Kinds", () =>
            validator.validateRowKinds(view.rows),
          );
          validation.execute("Summary Row Kinds", () =>
            validator.validateDtrSummaryRowKinds(view.rows),
          );
          validation.execute("Summary Row IDs", () =>
            validator.validateSummaryRowIds(view.rows),
          );
          validation.execute("Summary Row Count", () =>
            validator.validateSummaryRowCount(view),
          );
          validation.execute("Shared Summary Context", () =>
            validator.validateSharedSummaryContext(view.rows),
          );
          validation.execute("Summary Hierarchy Fields", () =>
            validator.validateSummaryHierarchyFields(view.rows),
          );
          validation.execute("Field Types", () =>
            validator.validateFieldTypes(view.rows),
          );
          validation.execute("Mandatory Fields", () =>
            validator.validateMandatoryFields(view.rows, query.hierarchyType),
          );
          validation.execute("Non-Negative Hourly Metrics", () =>
            validator.validateNonNegativeHourlyMetrics(view.rows),
          );
          validation.execute("Total Equals Hourly Sum", () =>
            validator.validateTotalEqualsHourlySum(view.rows),
          );
          validation.execute("Summary Loss Math", () =>
            validator.validateSummaryLossMath(view.rows),
          );
          validation.execute("Duplicate Consumer Meters", () =>
            validator.validateNoDuplicateConsumerMeters(view.rows),
          );
        }

        validation.execute("Cross Field Logic", () =>
          validator.validateCrossFieldLogic(view),
        );
      } finally {
        ApiValidationHelper.finalize(validation, {
          apiName: `Energy Audit Hourly Loss Report (${label})`,
          responseTime,
          testInfo,
          defectContext,
        });
      }
    },
  );
}
