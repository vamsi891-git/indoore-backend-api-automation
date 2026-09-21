import type { APIResponse } from "@playwright/test";
import { PerformanceTracker } from "../../../core/utils/performance.tracker";
import { AssetDetailApi } from "../Api/assetdetail.api";
import {
  assetManagementHierarchyMaxResponseTimeMs,
  assetManagementHierarchyRequestTimeoutMs,
} from "../Data/asset-management.common.data";
import type { AssetExplorerKind } from "../Data/assetdetail.data";
import { AssetDetailMapper } from "../Mapper/assetdetail.mapper";
import { AssetDetailValidator } from "../Validator/assetdetail.validator";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

export interface RunAssetDetailValidationOptions {
  api: AssetDetailApi;
  kind: AssetExplorerKind;
  id: number;
  testLabel: string;
  maxResponseTimeMs?: number;
  requestTimeoutMs?: number;
}

export async function runAssetDetailValidation(options: RunAssetDetailValidationOptions): Promise<{
  rawResponse: APIResponse;
  responseTime: number;
  data: ReturnType<typeof AssetDetailMapper.mapData>;
}> {
  const {
    api,
    kind,
    id,
    testLabel,
    maxResponseTimeMs = assetManagementHierarchyMaxResponseTimeMs,
    requestTimeoutMs = assetManagementHierarchyRequestTimeoutMs,
  } = options;

  const { rawResponse, responseBody, responseTime } = await api.getAssetDetail(
    kind,
    id,
    requestTimeoutMs,
  );

  await PerformanceTracker.track(rawResponse, testLabel, rawResponse.url(), responseTime);

  const assert = new ApiValidationHelper();
  const validation = new ApiValidationHelper();
  const validator = new AssetDetailValidator();
  const data = AssetDetailMapper.mapData(responseBody.data);

  validation.execute("Status", () => assert.validateStatusCode(rawResponse, 200));
  validation.execute("Content", () => assert.validateContentType(rawResponse));
  validation.execute("Response Time", () =>
    assert.validateResponseTime(responseTime, maxResponseTimeMs),
  );
  validation.execute("Security", () => assert.validateSensitiveData(responseBody));
  validation.execute("Response Contract", () => validator.validateResponse(responseBody));
  validation.execute("Columns", () => validator.validateColumns(data));
  validation.execute("Identity", () => validator.validateIdentity(data, kind, id));
  validation.execute("Timestamps", () => validator.validateTimestamps(data));
  validation.execute("Hierarchy Path", () => validator.validateHierarchyPath(data));
  validation.execute("Hierarchy Summary", () => validator.validateHierarchySummary(data));
  validation.execute("Counts", () => validator.validateCounts(data));
  validation.execute("Recent Activity", () => validator.validateRecentActivity(data));

  validation.printSummary(testLabel, responseTime);

  return { rawResponse, responseTime, data };
}
