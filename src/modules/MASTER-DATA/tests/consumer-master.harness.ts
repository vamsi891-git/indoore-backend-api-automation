import { APIResponse } from "@playwright/test";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { ConsumerMasterApi } from "../Api/consumer-master.api";
import { masterDataMaxResponseTimeMs } from "../Data/master-data.common.data";
import {
  ConsumerMasterMapper,
  ConsumerMasterQuery,
} from "../Mapper/consumer-master.mapper";
import { ConsumerMasterValidator } from "../Validator/consumer-master.validator";

export interface RunConsumerMasterValidationOptions {
  api: ConsumerMasterApi;
  query: ConsumerMasterQuery;
  testLabel: string;
  maxResponseTimeMs?: number;
  searchTerm?: string;
}

function buildQueryString(query: ConsumerMasterQuery): string {
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

export async function runConsumerMasterValidation(
  options: RunConsumerMasterValidationOptions,
): Promise<{ rawResponse: APIResponse; responseTime: number }> {
  const {
    api,
    query,
    testLabel,
    maxResponseTimeMs = masterDataMaxResponseTimeMs,
    searchTerm,
  } = options;

  const { rawResponse, responseBody, responseTime } =
    await api.getConsumerMasterData(query);

  await PerformanceTracker.track(
    rawResponse,
    testLabel,
    `${process.env.BASE_URL}/indore/master-data/consumer-master-data?${buildQueryString(query)}`,
    responseTime,
  );

  const assert = new AssertionEngine();
  const validation = new ValidationEngine();
  const validator = new ConsumerMasterValidator();
  const data = ConsumerMasterMapper.mapData(responseBody.data, query.limit ?? 20);

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
  validation.execute("Unique Meter Lookup IDs", () =>
    validator.validateUniqueMeterLookupIds(data),
  );
  validation.execute("Unique Consumer CIDs", () =>
    validator.validateUniqueConsumerCids(data),
  );
  validation.execute("Meter Phases", () => validator.validateMeterPhases(data));
  validation.execute("Hierarchy Fields", () =>
    validator.validateHierarchyFields(data),
  );

  if (searchTerm) {
    validation.execute("Search Results", () =>
      validator.validateSearchResults(data, searchTerm),
    );
  }

  validation.printSummary(testLabel, responseTime);
  return { rawResponse, responseTime };
}
