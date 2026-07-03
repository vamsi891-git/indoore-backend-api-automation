import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { MeterMasterApi } from "../Api/meter-master.api";
import {
  meterMasterMaxResponseTimeMs,
  meterMasterTestCases,
} from "../Data/meter-master.data";
import { MeterMasterMapper } from "../Mapper/meter-master.mapper";
import { MeterMasterValidator } from "../Validator/meter-master.validator";
import { MasterDataCommonValidator } from "../Validator/master-data-common.validator";
import { MeterMasterSuccessResponseSchema } from "../schemas/master-data.schemas";

test.describe("Meter Master API", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  for (const testCase of meterMasterTestCases) {
    test(
      testCase.testName,
      { tag: testCase.tags },
      async ({ authenticatedApi }) => {
        const api = new MeterMasterApi(authenticatedApi);
        const { rawResponse, responseBody, responseTime } =
          await api.getMeterMasterData(testCase.query);

        const params = new URLSearchParams();
        params.set("page", String(testCase.query.page ?? 1));
        params.set("limit", String(testCase.query.limit ?? 20));
        if (testCase.query.q?.trim()) {
          params.set("q", testCase.query.q.trim());
        }

        await PerformanceTracker.track(
          rawResponse,
          testCase.testName,
          `${process.env.BASE_URL}/indore/master-data/meter-master-data?${params}`,
          responseTime,
        );

        const assert = new AssertionEngine();
        const validation = new ValidationEngine();
        const validator = new MeterMasterValidator();
        const mapped = MeterMasterMapper.mapData(
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
            meterMasterMaxResponseTimeMs,
          ),
        );
        validation.execute("Security Validation", () =>
          assert.validateSensitiveData(responseBody),
        );
        validation.execute("Zod Response Schema", () =>
          MasterDataCommonValidator.validateZodResponseSchema(
            responseBody,
            MeterMasterSuccessResponseSchema,
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
        validation.execute("Unique Meter Lookup IDs", () =>
          validator.validateUniqueMeterLookupIds(mapped),
        );
        validation.execute("Unique Serials", () =>
          validator.validateUniqueMeterSerialsOnPage(mapped),
        );
        validation.execute("Serial Asset Consistency", () =>
          validator.validateSerialAssetConsistency(mapped),
        );
        validation.execute("Connected Meter Profile", () =>
          validator.validateConnectedMeterProfile(mapped),
        );
        validation.execute("Row Keys Match Columns", () =>
          validator.validateRowKeysMatchColumns(mapped),
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
