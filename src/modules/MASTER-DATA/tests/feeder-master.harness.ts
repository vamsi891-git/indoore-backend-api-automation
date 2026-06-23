import { APIResponse } from "@playwright/test";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { FeederMasterApi } from "../Api/feeder-master.api";
import { masterDataMaxResponseTimeMs } from "../Data/master-data.common.data";
import {
  FeederMasterMapper,
  FeederMasterQuery,
} from "../Mapper/feeder-master.mapper";
import { FeederMasterValidator } from "../Validator/feeder-master.validator";
import { MasterDataCommonValidator } from "../Validator/master-data-common.validator";
import { FeederMasterSuccessResponseSchema } from "../schemas/master-data.schemas";

export interface RunFeederMasterValidationOptions {
  api: FeederMasterApi;
  query: FeederMasterQuery;
  testLabel: string;
  maxResponseTimeMs?: number;
  searchTerm?: string;
}

function buildQueryString(query: FeederMasterQuery): string {
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

export async function runFeederMasterValidation(
  options: RunFeederMasterValidationOptions,
): Promise<{ rawResponse: APIResponse; responseTime: number }> {
  const {
    api,
    query,
    testLabel,
    maxResponseTimeMs = masterDataMaxResponseTimeMs,
    searchTerm,
  } = options;

  const { rawResponse, responseBody, responseTime } =
    await api.getFeederMasterData(query);

  await PerformanceTracker.track(
    rawResponse,
    testLabel,
    `${process.env.BASE_URL}/indore/master-data/feeder-master-data?${buildQueryString(query)}`,
    responseTime,
  );

  const assert = new AssertionEngine();
  const validation = new ValidationEngine();
  const validator = new FeederMasterValidator();
  const data = FeederMasterMapper.mapData(responseBody.data, query.limit ?? 20);

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
      FeederMasterSuccessResponseSchema,
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
  validation.execute("Hierarchy Fields", () =>
    validator.validateHierarchyFields(data),
  );
  validation.execute("Consumer DTR Relation", () =>
    validator.validateConsumerDtrRelation(data),
  );
  validation.execute("Unique Feeder Names", () =>
    validator.validateUniqueFeederNames(data),
  );
  validation.execute("Ascending Feeder Order", () =>
    validator.validateAscendingFeederOrder(data),
  );

  if (searchTerm) {
    validation.execute("Search Results", () =>
      validator.validateSearchResults(data, searchTerm),
    );
  }

  validation.printSummary(testLabel, responseTime);
  return { rawResponse, responseTime };
}
