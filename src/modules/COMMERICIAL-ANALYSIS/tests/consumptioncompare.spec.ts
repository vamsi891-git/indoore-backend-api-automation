import { test } from "../../../fixtures/api.fixture";
import { ConsumptionCompareApi } from "../Api/consumptioncompare.api";
import { mapConsumptionCompareResponse } from "../Mapper/consumptioncompare.mapper";
import { ConsumptionCompareValidator } from "../Validator/consumptioncompare.validator";
import { consumptionCompareLastMonthData } from "../Data/consumptioncompare.data";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

test.describe("Consumption Compare API", () => {
  test.describe.configure({ retries: 2 });
  test.setTimeout(180_000);

  test(
    "Validate Consumption Compare Last Month Report",
    { tag: ["@smoke", "@consumption-compare"] },
    async ({ authenticatedApi }, testInfo) => {
      const api = new ConsumptionCompareApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } =
        await api.getConsumptionCompare(consumptionCompareLastMonthData);

      const defectContext = {
        module: "COMMERICIAL ANALYSIS",
        endpoint: "/indore/analysis/commercial/consumption-compare",
        requestParams: consumptionCompareLastMonthData,
        responseStatus: rawResponse.status(),
        responseBody,
        expectedBehavior:
          "prevKwh > 0 and currKwh < 50% of prevKwh (currKwh < prevKwh * 0.5). Rows ordered by currKwh ASC.",
      };

      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new ConsumptionCompareValidator();

      try {
        validation.execute("Status Code Validation", () =>
          assert.validateStatusCode(rawResponse, 200),
        );

        validation.execute("Content Type Validation", () =>
          assert.validateContentType(rawResponse, "application/json"),
        );

        validation.execute("Response Time Validation", () =>
          assert.validateResponseTime(responseTime, 180_000),
        );

        validation.execute("Sensitive Data Validation", () =>
          assert.validateSensitiveData(responseBody),
        );

        const rows = mapConsumptionCompareResponse(responseBody);

        validation.execute("Response Validation", () =>
          validator.validateResponse(responseBody),
        );

        validation.execute("Query Params Validation", () =>
          validator.validateQueryParams(
            responseBody,
            consumptionCompareLastMonthData,
          ),
        );

        validation.execute("Report Type Validation", () =>
          validator.validateReportForType(
            responseBody,
            consumptionCompareLastMonthData.type,
          ),
        );

        const view = responseBody.data;
        const hasRows = Array.isArray(view.rows) && view.rows.length > 0;

        if (hasRows) {
          validation.execute("Has Data Validation", () =>
            validator.validateHasData(
              responseBody,
              consumptionCompareLastMonthData,
            ),
          );

          validation.execute("Mandatory Fields Validation", () =>
            validator.validateMandatoryFields(rows),
          );

          validation.execute("Consumption Compare Business Rules", () =>
            validator.validateBusinessRules(
              rows,
              consumptionCompareLastMonthData.type,
            ),
          );

          validation.execute("CurrKwh Sort Order Validation", () =>
            validator.validateSortOrder(
              rows,
              consumptionCompareLastMonthData.type,
            ),
          );

          validation.execute("Duplicate Record Validation", () =>
            validator.validateNoDuplicateRecords(rows),
          );
        } else {
          validation.execute("No Data Scenario Validation", () =>
            validator.validateNoDataScenario(
              responseBody,
              consumptionCompareLastMonthData,
            ),
          );
        }

        validation.execute("Pagination Validation", () =>
          validator.validatePagination(
            responseBody,
            consumptionCompareLastMonthData,
          ),
        );

        validation.execute("Total Count Validation", () =>
          validator.validateTotalCount(
            responseBody,
            consumptionCompareLastMonthData,
          ),
        );
      } finally {
        ApiValidationHelper.finalize(validation, {
          apiName: "Consumption Compare API",
          responseTime,
          testInfo,
          defectContext,
        });
      }
    },
  );
});
