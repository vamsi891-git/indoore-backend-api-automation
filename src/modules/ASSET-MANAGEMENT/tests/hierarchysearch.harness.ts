import type { APIResponse } from "@playwright/test";
import { PerformanceTracker } from "../../../core/utils/performance.tracker";
import { HierarchySearchApi } from "../Api/hierarchysearch.api";
import { assetManagementMaxResponseTimeMs } from "../Data/asset-management.common.data";
import type { HierarchyExplorerMode } from "../Data/hierarchychildren.data";
import { HierarchySearchMapper } from "../Mapper/hierarchysearch.mapper";
import { HierarchySearchValidator } from "../Validator/hierarchysearch.validator";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

export interface RunHierarchySearchValidationOptions {
  api: HierarchySearchApi;
  query: string;
  mode: HierarchyExplorerMode;
  q: string;
  page: number;
  pageSize: number;
  testLabel: string;
  requireItems?: boolean;
  checkMatch?: boolean;
  maxResponseTimeMs?: number;
}

export async function runHierarchySearchValidation(
  options: RunHierarchySearchValidationOptions,
): Promise<{
  rawResponse: APIResponse;
  responseTime: number;
  data: ReturnType<typeof HierarchySearchMapper.mapData>;
}> {
  const {
    api,
    query,
    mode,
    q,
    page,
    pageSize,
    testLabel,
    requireItems = true,
    checkMatch = true,
    maxResponseTimeMs = assetManagementMaxResponseTimeMs,
  } = options;

  const { rawResponse, responseBody, responseTime } = await api.getHierarchySearch(query);

  await PerformanceTracker.track(rawResponse, testLabel, rawResponse.url(), responseTime);

  const assert = new ApiValidationHelper();
  const validation = new ApiValidationHelper();
  const validator = new HierarchySearchValidator();
  const data = HierarchySearchMapper.mapData(responseBody.data);

  validation.execute("Status", () => assert.validateStatusCode(rawResponse, 200));
  validation.execute("Content", () => assert.validateContentType(rawResponse));
  validation.execute("Response Time", () =>
    assert.validateResponseTime(responseTime, maxResponseTimeMs),
  );
  validation.execute("Security", () => assert.validateSensitiveData(responseBody));
  validation.execute("Response Contract", () => validator.validateResponse(responseBody));
  validation.execute("Columns", () => validator.validateColumns(data));
  if (requireItems) {
    validation.execute("Items", () => validator.validateItemsExist(data));
  }
  validation.execute("Fields", () => validator.validateFields(data, mode));
  validation.execute("Ancestors", () => validator.validateAncestors(data));
  if (checkMatch && q.trim() !== "") {
    validation.execute("Search Match", () => validator.validateSearchMatch(data, q));
  }
  validation.execute("Duplicate IDs", () => validator.validateDuplicateIds(data));
  validation.execute("Pagination", () => validator.validatePagination(data));
  validation.execute("Pagination Consistency", () =>
    validator.validatePaginationConsistency(data, page, pageSize),
  );

  validation.printSummary(testLabel, responseTime);

  return { rawResponse, responseTime, data };
}
