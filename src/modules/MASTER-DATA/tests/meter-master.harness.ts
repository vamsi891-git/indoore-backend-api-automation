import { APIResponse } from "@playwright/test";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { MeterMasterApi } from "../Api/meter-master.api";
import { masterDataMaxResponseTimeMs } from "../Data/master-data.common.data";
import { MeterMasterMapper } from "../Mapper/meter-master.mapper";
import type { MeterMasterQuery } from "../Mapper/meter-master.mapper";
import { MeterMasterValidator } from "../Validator/meter-master.validator";

export interface RunMeterMasterValidationOptions {
  api: MeterMasterApi;
  query: MeterMasterQuery;
  testLabel: string;
  maxResponseTimeMs?: number;
  searchTerm?: string;
}

export async function runMeterMasterValidation(
  options: RunMeterMasterValidationOptions,
): Promise<{
  rawResponse: APIResponse;
  responseTime: number;
  firstNonNullSerial: string | null;
}> {
  const {
    api,
    query,
    testLabel,
    maxResponseTimeMs = masterDataMaxResponseTimeMs,
    searchTerm,
  } = options;

  const { rawResponse, responseBody, responseTime } =
    await api.getMeterMasterData(query);

  const qs = new URLSearchParams(
    Object.entries(query).reduce(
      (acc, [k, v]) => {
        if (v != null && v !== "") acc[k] = String(v);
        return acc;
      },
      {} as Record<string, string>,
    ),
  ).toString();

  await PerformanceTracker.track(
    rawResponse,
    testLabel,
    `${process.env.BASE_URL}/indore/master-data/meter-master-data?${qs}`,
    responseTime,
  );

  const assert = new AssertionEngine();
  const validation = new ValidationEngine();
  const validator = new MeterMasterValidator();
  const data = MeterMasterMapper.mapData(responseBody.data, query.limit ?? 20);

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
  validation.execute("Unique Meter Lookup IDs", () =>
    validator.validateUniqueMeterLookupIds(data),
  );
  validation.execute("Unique Meter Serials On Page", () =>
    validator.validateUniqueMeterSerialsOnPage(data),
  );
  validation.execute("Serial Asset Consistency", () =>
    validator.validateSerialAssetConsistency(data),
  );
  validation.execute("Connected Meter Profile", () =>
    validator.validateConnectedMeterProfile(data),
  );
  validation.execute("Row Keys Match Columns", () =>
    validator.validateRowKeysMatchColumns(data),
  );

  if (searchTerm) {
    validation.execute("Search Results", () =>
      validator.validateSearchResults(data, searchTerm),
    );
  }

  validation.printSummary(testLabel, responseTime);

  const firstNonNullSerial =
    data.items.find((row) => row.meterSerialNumber?.trim())?.meterSerialNumber ??
    null;

  return { rawResponse, responseTime, firstNonNullSerial };
}
