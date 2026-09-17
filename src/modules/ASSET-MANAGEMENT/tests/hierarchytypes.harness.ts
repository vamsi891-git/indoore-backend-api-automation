import type { APIResponse } from "@playwright/test";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { HierarchyTypesApi } from "../Api/hierarchytypes.api";
import { assetManagementMaxResponseTimeMs } from "../Data/asset-management.common.data";
import type { HierarchyExplorerMode } from "../Data/hierarchychildren.data";
import { HierarchyTypesMapper } from "../Mapper/hierarchytypes.mapper";
import { HierarchyTypesValidator } from "../Validator/hierarchytypes.validator";

export interface RunHierarchyTypesValidationOptions {
  api: HierarchyTypesApi;
  query: string;
  mode: HierarchyExplorerMode;
  testLabel: string;
  maxResponseTimeMs?: number;
}

export async function runHierarchyTypesValidation(
  options: RunHierarchyTypesValidationOptions,
): Promise<{
  rawResponse: APIResponse;
  responseTime: number;
  data: ReturnType<typeof HierarchyTypesMapper.mapData>;
}> {
  const {
    api,
    query,
    mode,
    testLabel,
    maxResponseTimeMs = assetManagementMaxResponseTimeMs,
  } = options;

  const { rawResponse, responseBody, responseTime } =
    await api.getHierarchyTypes(query);

  await PerformanceTracker.track(
    rawResponse,
    testLabel,
    rawResponse.url(),
    responseTime,
  );

  const assert = new AssertionEngine();
  const validation = new ValidationEngine();
  const validator = new HierarchyTypesValidator();
  const data = HierarchyTypesMapper.mapData(responseBody.data);

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
  validation.execute("Items", () => validator.validateItemsExist(data));
  validation.execute("Fields", () => validator.validateFields(data));
  validation.execute("Duplicate IDs", () => validator.validateDuplicateIds(data));
  validation.execute("Duplicate Types", () =>
    validator.validateDuplicateTypes(data),
  );
  validation.execute("Expected Types", () =>
    validator.validateExpectedTypes(data, mode),
  );

  validation.printSummary(testLabel, responseTime);

  return { rawResponse, responseTime, data };
}
