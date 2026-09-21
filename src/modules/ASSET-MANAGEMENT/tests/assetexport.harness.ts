import type { APIResponse } from "@playwright/test";
import { PerformanceTracker } from "../../../core/utils/performance.tracker";
import { AssetExportApi } from "../Api/assetexport.api";
import {
  assetManagementHierarchyMaxResponseTimeMs,
  assetManagementHierarchyRequestTimeoutMs,
} from "../Data/asset-management.common.data";
import type { AssetExportKind } from "../Data/assetexport.data";
import { AssetExportMapper } from "../Mapper/assetexport.mapper";
import { AssetExportValidator } from "../Validator/assetexport.validator";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

export interface RunAssetExportValidationOptions {
  api: AssetExportApi;
  query: string;
  kind: AssetExportKind;
  testLabel: string;
  requireRows?: boolean;
  q?: string;
  maxResponseTimeMs?: number;
  requestTimeoutMs?: number;
}

export async function runAssetExportValidation(options: RunAssetExportValidationOptions): Promise<{
  rawResponse: APIResponse;
  responseTime: number;
  csvContent: string;
  data: ReturnType<typeof AssetExportMapper.mapCsv>;
}> {
  const {
    api,
    query,
    kind,
    testLabel,
    requireRows = true,
    q,
    maxResponseTimeMs = assetManagementHierarchyMaxResponseTimeMs,
    requestTimeoutMs = assetManagementHierarchyRequestTimeoutMs,
  } = options;

  const { rawResponse, csvContent, responseTime } = await api.getExport(query, requestTimeoutMs);

  await PerformanceTracker.track(rawResponse, testLabel, rawResponse.url(), responseTime);

  const assert = new ApiValidationHelper();
  const validation = new ApiValidationHelper();
  const validator = new AssetExportValidator();
  const data = AssetExportMapper.mapCsv(csvContent);
  const headers = rawResponse.headers();

  validation.execute("Status", () => assert.validateStatusCode(rawResponse, 200));
  validation.execute("Content", () => assert.validateContentType(rawResponse, "text/csv"));
  validation.execute("Download Headers", () =>
    validator.validateDownloadHeaders(headers["content-type"], headers["content-disposition"]),
  );
  validation.execute("Response Time", () =>
    assert.validateResponseTime(responseTime, maxResponseTimeMs),
  );
  validation.execute("Security", () =>
    assert.validateSensitiveData({ csv: csvContent.slice(0, 4000) }),
  );
  validation.execute("CSV Body", () => validator.validateNotJsonError(csvContent));
  validation.execute("File", () => validator.validateFileNotEmpty(csvContent));
  validation.execute("Columns", () => validator.validateHeaders(data, kind));
  if (requireRows) {
    validation.execute("Rows", () => validator.validateRowsExist(data));
  }
  validation.execute("Row Schema", () => validator.validateRowSchema(data));
  validation.execute("Fields", () => validator.validateFields(data));
  validation.execute("Kind Counts", () => validator.validateKindCounts(data, kind));
  validation.execute("Hierarchy Types", () => validator.validateHierarchyTypes(data, kind));
  validation.execute("Duplicate Codes", () => validator.validateDuplicateCodes(data));
  if (q != null) {
    validation.execute("Search Filter", () => validator.validateQFilter(data, q));
  }

  validation.printSummary(testLabel, responseTime);

  return { rawResponse, responseTime, csvContent, data };
}
