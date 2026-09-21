import { test } from "../../../fixtures/api.fixture";
import { CommunicationOverviewApi } from "../Api/communication-overview.api";
import { CommunicationOverviewMapper } from "../Mapper/communication-overview.mapper";
import { CommunicationOverviewValidator } from "../Validator/communication-overview.validator";
import {
  communicationOverviewQuery,
  communicationOverviewTestCases,
  EXPECTED_OVERVIEW_PHASES,
} from "../Data/communication-overview.data";
import { MisDashboardEdgesValidator } from "../Validator/mis-dashboard.edges.validator";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

test.describe("Talking vs not talking overview", () => {
  for (const testCase of communicationOverviewTestCases) {
    test(testCase.testName, { tag: testCase.tags }, async ({ authenticatedApi }) => {
      const api = new CommunicationOverviewApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } = await api.getOverview(testCase.params);
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const validator = new CommunicationOverviewValidator();
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
      const data = CommunicationOverviewMapper.map(responseBody.data);
      validation.execute("Date range", () =>
        validator.validateWindow(
          data,
          testCase.expectedFromDate,
          testCase.expectedToDate,
          testCase.expectSameDayWindow,
        ),
      );
      validation.execute("Talking vs not talking adds up", () => validator.validateOverall(data));
      validation.execute("Meter type list", () => validator.validatePhases(data));
      if (testCase.checkExpectedLabels !== false) {
        validation.execute("Expected meter type names", () =>
          validator.validateExpectedPhaseLabels(
            data,
            testCase.expectedPhaseLabels ?? EXPECTED_OVERVIEW_PHASES,
          ),
        );
      }
      validation.execute("No duplicate meter type names", () =>
        validator.validateUniquePhaseLabels(data),
      );
      if (testCase.checkChartMembership !== false) {
        validation.execute("Meter type counts match talking meters", () =>
          validator.validatePhaseCountsMatchCommunicating(data),
        );
      }
      validation.printSummary(testCase.testName, responseTime);
    });
  }

  test(
    "Talking vs not talking overview — all meters equals consumer plus DTR",
    { tag: ["@mis-dashboard", "@edge"] },
    async ({ authenticatedApi }) => {
      const api = new CommunicationOverviewApi(authenticatedApi);
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const validator = new CommunicationOverviewValidator();
      const [allResult, consumerResult, dtrResult] = await Promise.all([
        api.getOverview({ ...communicationOverviewQuery, assetType: "all" }),
        api.getOverview({
          ...communicationOverviewQuery,
          assetType: "consumer",
        }),
        api.getOverview({ ...communicationOverviewQuery, assetType: "dtr" }),
      ]);

      validation.execute("All meters status", () =>
        assert.validateStatusCode(allResult.rawResponse, 200),
      );
      validation.execute("Consumer status", () =>
        assert.validateStatusCode(consumerResult.rawResponse, 200),
      );
      validation.execute("DTR status", () => assert.validateStatusCode(dtrResult.rawResponse, 200));
      const allMeters = CommunicationOverviewMapper.map(allResult.responseBody.data);
      const consumers = CommunicationOverviewMapper.map(consumerResult.responseBody.data);
      const dtrs = CommunicationOverviewMapper.map(dtrResult.responseBody.data);
      validation.execute("All equals consumer plus DTR", () =>
        validator.validateAllEqualsConsumerPlusDtr(allMeters, consumers, dtrs),
      );
      validation.printSummary(
        "Talking vs not talking overview — all meters equals consumer plus DTR",
        allResult.responseTime,
      );
    },
  );
});
