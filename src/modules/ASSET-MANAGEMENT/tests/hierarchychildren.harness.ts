import type { APIResponse } from "@playwright/test";
import { PerformanceTracker } from "../../../core/utils/performance.tracker";
import { HierarchyChildrenApi } from "../Api/hierarchychildren.api";
import { assetManagementMaxResponseTimeMs } from "../Data/asset-management.common.data";
import type { HierarchyExplorerMode } from "../Data/hierarchychildren.data";
import { HierarchyChildrenMapper } from "../Mapper/hierarchychildren.mapper";
import { HierarchyChildrenValidator } from "../Validator/hierarchychildren.validator";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

export interface RunHierarchyChildrenValidationOptions {
  api: HierarchyChildrenApi;
  query: string;
  mode: HierarchyExplorerMode;
  page: number;
  pageSize: number;
  testLabel: string;
  parentId?: number;
  requireItems?: boolean;
  maxResponseTimeMs?: number;
}

export async function runHierarchyChildrenValidation(
  options: RunHierarchyChildrenValidationOptions,
): Promise<{
  rawResponse: APIResponse;
  responseTime: number;
  data: ReturnType<typeof HierarchyChildrenMapper.mapData>;
}> {
  const {
    api,
    query,
    mode,
    page,
    pageSize,
    testLabel,
    parentId,
    requireItems = true,
    maxResponseTimeMs = assetManagementMaxResponseTimeMs,
  } = options;

  const { rawResponse, responseBody, responseTime } = await api.getHierarchyChildren(query);

  await PerformanceTracker.track(rawResponse, testLabel, rawResponse.url(), responseTime);

  const assert = new ApiValidationHelper();
  const validation = new ApiValidationHelper();
  const validator = new HierarchyChildrenValidator();
  const data = HierarchyChildrenMapper.mapData(responseBody.data);

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
  validation.execute("Duplicate IDs", () => validator.validateDuplicateIds(data));
  validation.execute("Pagination", () => validator.validatePagination(data));
  validation.execute("Pagination Consistency", () =>
    validator.validatePaginationConsistency(data, page, pageSize),
  );
  if (parentId != null) {
    validation.execute("Parent ID", () => validator.validateParentId(data.items, parentId));
  }

  validation.printSummary(testLabel, responseTime);

  return { rawResponse, responseTime, data };
}
