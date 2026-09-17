import type { APIResponse } from "@playwright/test";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { MapMarkersApi } from "../Api/mapmarkers.api";
import { assetManagementMaxResponseTimeMs } from "../Data/asset-management.common.data";
import { MapMarkersMapper } from "../Mapper/mapmarkers.mapper";
import { MapMarkersValidator } from "../Validator/mapmarkers.validator";

export interface RunMapMarkersValidationOptions {
  api: MapMarkersApi;
  query: string;
  testLabel: string;
  requestedLimit: number;
  requireMarkers?: boolean;
  expectEmpty?: boolean;
  maxResponseTimeMs?: number;
}

export async function runMapMarkersValidation(
  options: RunMapMarkersValidationOptions,
): Promise<{
  rawResponse: APIResponse;
  responseTime: number;
  data: ReturnType<typeof MapMarkersMapper.mapData>;
}> {
  const {
    api,
    query,
    testLabel,
    requestedLimit,
    requireMarkers = true,
    expectEmpty = false,
    maxResponseTimeMs = assetManagementMaxResponseTimeMs,
  } = options;

  const { rawResponse, responseBody, responseTime } =
    await api.getMapMarkers(query);

  await PerformanceTracker.track(
    rawResponse,
    testLabel,
    rawResponse.url(),
    responseTime,
  );

  const assert = new AssertionEngine();
  const validation = new ValidationEngine();
  const validator = new MapMarkersValidator();
  const data = MapMarkersMapper.mapData(responseBody.data);

  validation.execute("Status", () => assert.validateStatusCode(rawResponse, 200));
  validation.execute("Content", () => assert.validateContentType(rawResponse));
  validation.execute("Response Time", () =>
    assert.validateResponseTime(responseTime, maxResponseTimeMs),
  );
  validation.execute("Security", () =>
    assert.validateSensitiveData(responseBody),
  );
  validation.execute("Response Contract", () =>
    validator.validateResponse(responseBody),
  );
  validation.execute("Columns", () => validator.validateColumns(data));
  validation.execute("Limit", () => validator.validateLimit(data, requestedLimit));
  validation.execute("Count", () => validator.validateCount(data));
  validation.execute("Totals", () => validator.validateTotals(data));
  if (expectEmpty) {
    validation.execute("Empty", () => validator.validateEmpty(data));
  } else if (requireMarkers) {
    validation.execute("Markers", () => validator.validateMarkersExist(data));
  }
  validation.execute("Fields", () => validator.validateFields(data));
  validation.execute("Duplicate IDs", () => validator.validateDuplicateIds(data));

  validation.printSummary(testLabel, responseTime);

  return { rawResponse, responseTime, data };
}
