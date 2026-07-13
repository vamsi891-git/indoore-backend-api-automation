import { test } from "../../../fixtures/api.fixture";
import { LFAnalysisApi } from "../Api/loadfactor.api";
import { mapLFAnalysisResponse } from "../Mapper/loadfactor.mapper";
import { LFAnalysisValidator } from "../Validator/loadfactor.validator";
import { lfAnalysisData } from "../Data/loadfactor.api";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";
test.describe("LF Analysis API", () => {
  test.setTimeout(120000);
  test("Validate LF Analysis Report",
    {
      tag: ["@smoke", "@lf-analysis"],
    },
    async ({ authenticatedApi }, testInfo) => {
      // =====================
      // API
      // =====================
      const api = new LFAnalysisApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } =
        await api.getLFAnalysis(lfAnalysisData);
      const defectContext = {
        module: "COMMERICIAL-ANALYSIS",
        endpoint: rawResponse.url(),
        requestParams: lfAnalysisData,
        responseStatus: rawResponse.status(),
        responseBody,
        expectedBehavior:
          "lf = (kwh*100)/(md_kw*billing_minutes/60). operator 'lt' => lf < threshold; 'gt' => lf > threshold.",
      };

      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
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
      // =====================
      // Mapper
      // =====================
      const rows = mapLFAnalysisResponse(responseBody);
      // =====================
      // Validator
      // =====================
      const validator = new LFAnalysisValidator();
      validation.execute("Response Validation", () =>
        validator.validateResponse(responseBody),
      );

      validation.execute("Query Params Validation", () =>
        validator.validateQueryParams(responseBody, lfAnalysisData),
      );

      validation.execute("Mandatory Fields Validation", () =>
        validator.validateMandatoryFields(rows),
      );

      validation.execute("LF Threshold Validation", () =>
        validator.validateLfAgainstThreshold(rows,lfAnalysisData.threshold,lfAnalysisData.operator,),
      );
      validation.execute("Duplicate LF Validation", () =>
        validator.validateNoDuplicateLFRecords(rows),
      );
      validation.execute("Pagination Validation", () =>
        validator.validatePagination(responseBody, lfAnalysisData),
      );
      validation.execute("Total Count Validation", () =>
        validator.validateTotalCount(responseBody, lfAnalysisData),
      );
      } finally {
        ApiValidationHelper.finalize(validation, {
          apiName: "LF Analysis API",
          responseTime,
          testInfo,
          defectContext,
        });
      }
    },
  );
});
