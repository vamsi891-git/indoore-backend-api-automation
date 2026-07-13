import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { ConsumerMasterApi } from "../Api/consumer-master.api";
import {
  consumerMasterMaxResponseTimeMs,
  consumerMasterTestCases,
} from "../Data/consumer-master.data";
import { ConsumerMasterMapper } from "../Mapper/consumer-master.mapper";
import { ConsumerMasterValidator } from "../Validator/consumer-master.validator";
import { MasterDataCommonValidator } from "../Validator/master-data-common.validator";
import { ConsumerMasterSuccessResponseSchema } from "../schemas/master-data.schemas";

test.describe("Consumer Master API", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  for (const testCase of consumerMasterTestCases) {
    test(
      testCase.testName,
      { tag: testCase.tags },
      async ({ authenticatedApi }) => {
        const api = new ConsumerMasterApi(authenticatedApi);
        const { rawResponse, responseBody, responseTime } =
          await api.getConsumerMasterData(testCase.query);

        const params = new URLSearchParams();
        params.set("page", String(testCase.query.page ?? 1));
        params.set("limit", String(testCase.query.limit ?? 20));
        params.set("meterType", testCase.query.meterType ?? "all");
        if (testCase.query.q?.trim()) {
          params.set("q", testCase.query.q.trim());
        }

        await PerformanceTracker.track(
        rawResponse,
        testCase.testName,
        rawResponse.url(),
        responseTime
      );

        const assert = new AssertionEngine();
        const validation = new ValidationEngine();
        const validator = new ConsumerMasterValidator();
        const mapped = ConsumerMasterMapper.mapData(
          responseBody.data,
          testCase.query.limit ?? 20,
        );

        validation.execute("Status Validation", () =>
          assert.validateStatusCode(rawResponse, 200),
        );
        validation.execute("Content Validation", () =>
          assert.validateContentType(rawResponse),
        );
        validation.execute("Response Time", () =>
          assert.validateResponseTime(
            responseTime,
            consumerMasterMaxResponseTimeMs,
          ),
        );
        validation.execute("Security Validation", () =>
          assert.validateSensitiveData(responseBody),
        );
        validation.execute("Zod Response Schema", () =>
          MasterDataCommonValidator.validateZodResponseSchema(
            responseBody,
            ConsumerMasterSuccessResponseSchema,
          ),
        );
        validation.execute("Response", () =>
          validator.validateResponse(responseBody),
        );
        validation.execute("Columns", () => validator.validateColumns(mapped));
        validation.execute("Items Exist", () =>
          validator.validateItemsExist(mapped),
        );
        validation.execute("Fields", () => validator.validateFields(mapped));
        validation.execute("Pagination", () =>
          validator.validatePagination(mapped),
        );
        validation.execute("Query Params", () =>
          validator.validateQueryParams(mapped, testCase.query),
        );
        validation.execute("Sl No Sequence", () =>
          validator.validateSlNoSequence(mapped),
        );
        validation.execute("Row Keys Match Columns", () =>
          validator.validateRowKeysMatchColumns(mapped),
        );
        validation.execute("ID Matches Consumer CID", () =>
          validator.validateIdMatchesConsumerCid(mapped),
        );
        validation.execute("Unique Meter Lookup IDs", () =>
          validator.validateUniqueMeterLookupIds(mapped),
        );
        validation.execute("Unique Meter Serials", () =>
          validator.validateUniqueMeterSerialsOnPage(mapped),
        );
        validation.execute("Unique Consumer CIDs", () =>
          validator.validateUniqueConsumerCids(mapped),
        );
        validation.execute("IVRS Consistency", () =>
          validator.validateIvrsConsistency(mapped),
        );
        validation.execute("Meter Phases", () =>
          validator.validateMeterPhases(mapped),
        );
        validation.execute("Hierarchy Fields", () =>
          validator.validateHierarchyFields(mapped),
        );

        if (testCase.searchTerm) {
          validation.execute("Search Results", () =>
            validator.validateSearchResults(mapped, testCase.searchTerm!),
          );
        }

        validation.printSummary(testCase.testName, responseTime);
      },
    );
  }
});
