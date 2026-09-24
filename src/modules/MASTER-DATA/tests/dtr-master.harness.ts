import { APIResponse } from "@playwright/test";
import { PerformanceTracker } from "../../../core/utils/performance.tracker";
import { DtrMasterApi } from "../Api/dtr-master.api";
import { masterDataMaxResponseTimeMs } from "../Data/master-data.common.data";
import { DtrMasterMapper, DtrMasterQuery } from "../Mapper/dtr-master.mapper";
import { DtrMasterValidator } from "../Validator/dtr-master.validator";
import { MasterDataCommonValidator } from "../Validator/master-data-common.validator";
import { DtrMasterSuccessResponseSchema } from "../schemas/master-data.schemas";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

export interface RunDtrMasterValidationOptions {
  api: DtrMasterApi;
  query: DtrMasterQuery;
  testLabel: string;
  maxResponseTimeMs?: number;
  searchTerm?: string;
}

export async function runDtrMasterValidation(
  options: RunDtrMasterValidationOptions,
): Promise<{ rawResponse: APIResponse; responseTime: number }> {
  const {
    api,
    query,
    testLabel,
    maxResponseTimeMs = masterDataMaxResponseTimeMs,
    searchTerm,
  } = options;

  const { rawResponse, responseBody, responseTime } = await api.getDtrMasterData(query);

  await PerformanceTracker.track(rawResponse, testLabel, rawResponse.url(), responseTime);

  const assert = new ApiValidationHelper();
  const validation = new ApiValidationHelper();
  const validator = new DtrMasterValidator();
  const data = DtrMasterMapper.mapData(responseBody.data, query.limit ?? 20);

  validation.execute("Status Validation", () => assert.validateStatusCode(rawResponse, 200));
  validation.execute("Content Validation", () => assert.validateContentType(rawResponse));
  validation.execute("Response Time", () =>
    assert.validateResponseTime(responseTime, maxResponseTimeMs),
  );
  validation.execute("Security Validation", () => assert.validateSensitiveData(responseBody));
  validation.execute("Zod Response Schema", () =>
    MasterDataCommonValidator.validateZodResponseSchema(
      responseBody,
      DtrMasterSuccessResponseSchema,
    ),
  );
  validation.execute("Response", () => validator.validateResponse(responseBody));
  validation.execute("Columns", () => validator.validateColumns(data));
  validation.execute("Items", () => validator.validateItemsExist(data));
  validation.execute("Fields", () => validator.validateFields(data));
  validation.execute("Pagination", () => validator.validatePagination(data));
  validation.execute("Query Params", () => validator.validateQueryParams(data, query));
  validation.execute("Sl No Sequence", () => validator.validateSlNoSequence(data));
  validation.execute("Row Keys Match Columns", () => validator.validateRowKeysMatchColumns(data));
  validation.execute("Unique Meter Serials", () => validator.validateUniqueMeterSerials(data));
  validation.execute("Ascending DTR Order", () => validator.validateAscendingDtrOrder(data));
  validation.execute("Coordinates", () => validator.validateCoordinates(data));

  if (searchTerm) {
    validation.execute("Search Results", () => validator.validateSearchResults(data, searchTerm));
  }

  validation.printSummary(testLabel, responseTime);
  return { rawResponse, responseTime };
}
