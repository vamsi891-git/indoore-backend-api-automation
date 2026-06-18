import { test } from "../../../fixtures/api.fixture";
import { PowerFactorApi } from "../Api/powerfactor.api";
import { pfAnalysisQuery } from "../Data/powerfactor.data";
import { PowerFactorMapper } from "../Mapper/powerfactor.mapper";
import { PowerFactorValidator } from "../Validator/powerfactoranalysis.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

test.describe("Power Factor Analysis API", () => {
  test.setTimeout(120000);
  test("Validate Power Factor Analysis Report",
    { tag: ["@smoke", "@power-factor"] },
    async ({ authenticatedApi }, testInfo) => {
      const api = new PowerFactorApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new PowerFactorValidator();
      const { rawResponse, responseBody, responseTime } =
        await api.getPfAnalysis(pfAnalysisQuery);
      const defectContext = {
        module: "COMMERICIAL ANALYSIS",
        endpoint: "/indore/analysis/commercial/pf",
        requestParams: pfAnalysisQuery,
        responseStatus: rawResponse.status(),
        responseBody,
        expectedBehavior:
          "Each row must have AVG(pf) where pf IS NOT NULL, pf > 0, and pf < query threshold (default 0.8). Column PF<.8 echoes the threshold.",
      };

      try {
      validation.execute("Status Code Validation", () =>
        assert.validateStatusCode(rawResponse, 200),
      );

      validation.execute("Content Type Validation", () =>
        assert.validateContentType(rawResponse, "application/json"),
      );

      validation.execute("Response Time Validation", () =>
        assert.validateResponseTime(responseTime, 120000),
      );

      validation.execute("Sensitive Data Validation", () =>
        assert.validateSensitiveData(responseBody),
      );

      const rows = PowerFactorMapper.mapPfRows(responseBody.data.rows);

      validation.execute("Response Validation", () =>
        validator.validateResponse(responseBody),
      );

      validation.execute("Query Params Validation", () =>
        validator.validateQueryParams(responseBody, pfAnalysisQuery),
      );

      validation.execute("Mandatory Fields Validation", () =>
        validator.validateMandatoryFields(rows),
      );

      validation.execute("PF Below Threshold Validation", () =>
        validator.validatePfBelowThreshold(rows, pfAnalysisQuery.threshold),
      );

      validation.execute("Report Threshold Column Validation", () =>
        validator.validateReportThresholdColumn(rows, pfAnalysisQuery.threshold),
      );

      validation.execute("Duplicate PF Record Validation", () =>
        validator.validateNoDuplicatePfRecords(rows),
      );

      validation.execute("Pagination Validation", () =>
        validator.validatePagination(responseBody, pfAnalysisQuery),
      );

      validation.execute("Total Count Validation", () =>
        validator.validateTotalCount(responseBody, pfAnalysisQuery),
      );
      } finally {
        ApiValidationHelper.finalize(validation, {
          apiName: "Power Factor API",
          responseTime,
          testInfo,
          defectContext,
        });
      }
    },
  );
});
