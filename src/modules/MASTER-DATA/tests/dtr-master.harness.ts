import { APIResponse } from "@playwright/test";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { DtrMasterApi } from "../Api/dtr-master.api";
import { masterDataMaxResponseTimeMs } from "../Data/master-data.common.data";
import { DtrMasterMapper, DtrMasterQuery } from "../Mapper/dtr-master.mapper";
import { DtrMasterValidator } from "../Validator/dtr-master.validator";
import { MasterDataCommonValidator } from "../Validator/master-data-common.validator";
import { DtrMasterSuccessResponseSchema } from "../schemas/master-data.schemas";

export interface RunDtrMasterValidationOptions {
  api: DtrMasterApi;
  query: DtrMasterQuery;
  testLabel: string;
  maxResponseTimeMs?: number;
  searchTerm?: string;
}

function buildQueryString(query: DtrMasterQuery): string {
  return new URLSearchParams(
    Object.entries(query).reduce(
      (acc, [k, v]) => {
        if (v != null && v !== "") acc[k] = String(v);
        return acc;
      },
      {} as Record<string, string>,
    ),
  ).toString();
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

  const { rawResponse, responseBody, responseTime } =
    await api.getDtrMasterData(query);

  await PerformanceTracker.track(
    rawResponse,
    testLabel,
    `${process.env.BASE_URL}/indore/master-data/dtr-master-data?${buildQueryString(query)}`,
    responseTime,
  );

  const assert = new AssertionEngine();
  const validation = new ValidationEngine();
  const validator = new DtrMasterValidator();
  const data = DtrMasterMapper.mapData(responseBody.data, query.limit ?? 20);

  validation.execute("Status Validation", () =>
    assert.validateStatusCode(rawResponse, 200),
  );
  validation.execute("Content Validation", () =>
    assert.validateContentType(rawResponse),
  );
  validation.execute("Response Time", () =>
    assert.validateResponseTime(responseTime, maxResponseTimeMs),
  );
  validation.execute("Security Validation", () =>
    assert.validateSensitiveData(responseBody),
  );
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
  validation.execute("Query Params", () =>
    validator.validateQueryParams(data, query),
  );
  validation.execute("Sl No Sequence", () => validator.validateSlNoSequence(data));
  validation.execute("Row Keys Match Columns", () =>
    validator.validateRowKeysMatchColumns(data),
  );
  validation.execute("Unique Meter Serials", () =>
    validator.validateUniqueMeterSerials(data),
  );
  validation.execute("Ascending DTR Order", () =>
    validator.validateAscendingDtrOrder(data),
  );
  validation.execute("Coordinates", () => validator.validateCoordinates(data));

  if (searchTerm) {
    validation.execute("Search Results", () =>
      validator.validateSearchResults(data, searchTerm),
    );
  }

  validation.printSummary(testLabel, responseTime);
  return { rawResponse, responseTime };
}
