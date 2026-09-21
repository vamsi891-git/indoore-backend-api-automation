import { test } from "../../../fixtures/api.fixture";
import { CommunicationCategoryApi } from "../Api/communication-category.api";
import { CommunicationCategoryMapper } from "../Mapper/communication-category.mapper";
import { CommunicationCategoryValidator } from "../Validator/communication-category.validator";
import {
  communicationCategoryQuery,
  communicationCategoryTestCases,
} from "../Data/communication-category.data";
import { MisDashboardEdgesValidator } from "../Validator/mis-dashboard.edges.validator";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

test.describe("Talking meters by category", () => {
  for (const testCase of communicationCategoryTestCases) {
    test(testCase.testName, { tag: testCase.tags }, async ({ authenticatedApi }) => {
      const api = new CommunicationCategoryApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } = await api.getCategories(testCase.params);
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const validator = new CommunicationCategoryValidator();
      const edges = new MisDashboardEdgesValidator();

      validation.execute("Status", () =>
        assert.validateStatusCode(rawResponse, testCase.expectedStatus, responseBody),
      );
      validation.execute("Content", () =>
        assert.validateContentType(rawResponse, "application/json"),
      );
      validation.execute("Performance", () => assert.validateResponseTime(responseTime, 120000));
      validation.execute("Sensitive Data", () => assert.validateSensitiveData(responseBody));

      if (testCase.expectedStatus !== 200) {
        validation.execute("Error code", () => edges.validateValidationError(responseBody));
        validation.printSummary(testCase.testName, responseTime);
        return;
      }

      validation.execute("Response", () => validator.validateResponse(responseBody));
      const data = CommunicationCategoryMapper.map(responseBody.data);
      validation.execute("Date range", () =>
        validator.validateWindow(
          data,
          testCase.expectedFromDate,
          testCase.expectedToDate,
          testCase.expectSameDayWindow,
        ),
      );
      validation.execute("Category list", () => validator.validateCategories(data));
      if (testCase.checkExpectedLabels !== false) {
        validation.execute("Expected category names", () =>
          validator.validateExpectedCategoryLabels(data),
        );
      }
      validation.execute("No duplicate category names", () =>
        validator.validateUniqueCategoryLabels(data),
      );
      if (testCase.expectZeroCounts) {
        validation.execute("No talking counts for this meter kind", () =>
          validator.validateZeroCounts(data),
        );
      }
      validation.printSummary(testCase.testName, responseTime);
    });
  }

  test(
    "Talking meters by category — consumer and DTR stay within all meters",
    { tag: ["@mis-dashboard", "@edge"] },
    async ({ authenticatedApi }) => {
      const api = new CommunicationCategoryApi(authenticatedApi);
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const validator = new CommunicationCategoryValidator();
      const [allResult, consumerResult, dtrResult] = await Promise.all([
        api.getCategories({ ...communicationCategoryQuery, assetType: "all" }),
        api.getCategories({
          ...communicationCategoryQuery,
          assetType: "consumer",
        }),
        api.getCategories({ ...communicationCategoryQuery, assetType: "dtr" }),
      ]);

      validation.execute("All meters status", () =>
        assert.validateStatusCode(allResult.rawResponse, 200),
      );
      validation.execute("Consumer status", () =>
        assert.validateStatusCode(consumerResult.rawResponse, 200),
      );
      validation.execute("DTR status", () => assert.validateStatusCode(dtrResult.rawResponse, 200));

      const allMeters = CommunicationCategoryMapper.map(allResult.responseBody.data);
      const consumers = CommunicationCategoryMapper.map(consumerResult.responseBody.data);
      const dtrs = CommunicationCategoryMapper.map(dtrResult.responseBody.data);

      validation.execute("Consumer counts do not exceed all meters", () =>
        validator.validateSubsetDoesNotExceedAll(allMeters, consumers),
      );
      validation.execute("DTR counts do not exceed all meters", () =>
        validator.validateSubsetDoesNotExceedAll(allMeters, dtrs),
      );
      validation.printSummary(
        "Talking meters by category — consumer and DTR stay within all meters",
        allResult.responseTime,
      );
    },
  );
});
