import { test } from "../../../fixtures/api.fixture";
import { MdAnalysisApi } from "../Api/mdanalysis.api";
import { mapMdAnalysisResponse } from "../Mapper/mdanalysis.mapper";
import { MdAnalysisValidator } from "../Validator/mdanalysis.validator";
import { mdAnalysisCdCompareData } from "../Data/mdanalysis.data";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

test.describe("MD Analysis API", () => {
  test.setTimeout(120000);

  test(
    "Validate MD > CD Last Three Month Report",
    { tag: ["@smoke", "@md-analysis"] },
    async ({ authenticatedApi }, testInfo) => {
      const api = new MdAnalysisApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } =
        await api.getMdAnalysis(mdAnalysisCdCompareData);

      const defectContext = {
        module: "COMMERICIAL ANALYSIS",
        endpoint: "/indore/analysis/commercial/md",
        requestParams: mdAnalysisCdCompareData,
        responseStatus: rawResponse.status(),
        responseBody,
        expectedBehavior:
          "Last N months: MAX(md_kw) where md_kw > 0. For MD > CD / cd_compare: sanctionedLoad > 0 and md > sanctionedLoad. Rows ordered by md DESC.",
      };

      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new MdAnalysisValidator();

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

        const rows = mapMdAnalysisResponse(responseBody);

        validation.execute("Response Validation", () =>
          validator.validateResponse(responseBody),
        );

        validation.execute("Query Params Validation", () =>
          validator.validateQueryParams(responseBody, mdAnalysisCdCompareData),
        );

        validation.execute("Report Type Validation", () =>
          validator.validateReportForType(
            responseBody,
            mdAnalysisCdCompareData.type,
          ),
        );

        validation.execute("Mandatory Fields Validation", () =>
          validator.validateMandatoryFields(rows),
        );

        validation.execute("MD Business Rules Validation", () =>
          validator.validateBusinessRules(rows, mdAnalysisCdCompareData.type),
        );

        validation.execute("MD Descending Order Validation", () =>
          validator.validateMdDescendingOrder(rows),
        );

        validation.execute("Duplicate MD Record Validation", () =>
          validator.validateNoDuplicateMdRecords(rows),
        );

        validation.execute("Pagination Validation", () =>
          validator.validatePagination(responseBody, mdAnalysisCdCompareData),
        );

        validation.execute("Total Count Validation", () =>
          validator.validateTotalCount(responseBody, mdAnalysisCdCompareData),
        );
      } finally {
        ApiValidationHelper.finalize(validation, {
          apiName: "MD Analysis API",
          responseTime,
          testInfo,
          defectContext,
        });
      }
    },
  );
});
