import type { APIResponse } from "@playwright/test";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { NetworkHierarchyApi } from "../Api/networkhierarchy.api";
import {
  assetManagementMaxResponseTimeMs,
  assetManagementHierarchyMaxResponseTimeMs,
  assetManagementHierarchyRequestTimeoutMs,
  assetManagementPaths,
} from "../Data/asset-management.common.data";
import { NetworkHierarchyMapper } from "../Mapper/networkhierarchy.mapper";
import { NetworkHierarchyValidator } from "../Validator/networkhierarchy.validator";

export interface RunNetworkHierarchyValidationOptions {
  api: NetworkHierarchyApi;
  testLabel: string;
  rootId?: number;
  maxResponseTimeMs?: number;
  requestTimeoutMs?: number;
  includeSubtreeChecks?: boolean;
  /** Validate subtree root on an already-fetched tree (no extra API call). */
  subtreeRootId?: number;
}

export async function runNetworkHierarchyValidation(
  options: RunNetworkHierarchyValidationOptions,
): Promise<{
  rawResponse: APIResponse;
  responseTime: number;
  hierarchy: ReturnType<typeof NetworkHierarchyMapper.mapData>["hierarchy"];
}> {
  const {
    api,
    testLabel,
    rootId,
    maxResponseTimeMs = assetManagementMaxResponseTimeMs,
    requestTimeoutMs,
    includeSubtreeChecks = false,
    subtreeRootId,
  } = options;

  const { rawResponse, responseBody, responseTime } =
    await api.getNetworkHierarchy(rootId, requestTimeoutMs);

  const query = rootId != null ? `?rootId=${rootId}` : "";
  await PerformanceTracker.track(
        rawResponse,
        testLabel,
        rawResponse.url(),
        responseTime
      );

  const assert = new AssertionEngine();
  const validation = new ValidationEngine();
  const validator = new NetworkHierarchyValidator();
  const data = NetworkHierarchyMapper.mapData(responseBody.data);

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
  validation.execute("Response Contract", () =>
    validator.validateResponse(responseBody),
  );
  validation.execute("Items", () => validator.validateItemsExist(data));
  validation.execute("Fields", () =>
    validator.validateHierarchyFields(data.hierarchy),
  );
  validation.execute("Duplicate IDs", () =>
    validator.validateDuplicateIds(data.hierarchy),
  );
  validation.execute("Expected Levels", () =>
    validator.validateExpectedLevels(data.hierarchy),
  );
  validation.execute("DTRs Not In Children", () =>
    validator.validateDtrsNotInChildren(data.hierarchy),
  );
  validation.execute("DTR Arrays", () =>
    validator.validateDtrArrays(data.hierarchy),
  );

  if (includeSubtreeChecks && rootId != null) {
    validation.execute("Subtree Root", () =>
      validator.validateSubtreeRoot(data.hierarchy, rootId),
    );
  } else if (subtreeRootId != null) {
    validation.execute("Subtree Root", () =>
      validator.validateSubtreeRoot(data.hierarchy, subtreeRootId),
    );
  }

  validation.printSummary(testLabel, responseTime);

  return { rawResponse, responseTime, hierarchy: data.hierarchy };
}
