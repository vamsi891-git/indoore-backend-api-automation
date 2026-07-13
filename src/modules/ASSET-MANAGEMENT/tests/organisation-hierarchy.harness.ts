import type { APIResponse } from "@playwright/test";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { OrganisationHierarchyApi } from "../Api/organizationhierarchy.api";
import {
  assetManagementMaxResponseTimeMs,
  assetManagementHierarchyMaxResponseTimeMs,
  assetManagementHierarchyRequestTimeoutMs,
  assetManagementPaths,
} from "../Data/asset-management.common.data";
import { OrganisationHierarchyMapper } from "../Mapper/organizationhierarchy.mapper";
import { OrganisationHierarchyValidator } from "../Validator/organizationhierarchy.validator";

export interface RunOrganisationHierarchyValidationOptions {
  api: OrganisationHierarchyApi;
  testLabel: string;
  rootId?: number;
  maxResponseTimeMs?: number;
  requestTimeoutMs?: number;
  includeSubtreeChecks?: boolean;
  subtreeRootId?: number;
}

export async function runOrganisationHierarchyValidation(
  options: RunOrganisationHierarchyValidationOptions,
): Promise<{
  rawResponse: APIResponse;
  responseTime: number;
  hierarchy: ReturnType<typeof OrganisationHierarchyMapper.mapData>["hierarchy"];
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
    await api.getOrganisationHierarchy(rootId, requestTimeoutMs);

  const query = rootId != null ? `?rootId=${rootId}` : "";
  await PerformanceTracker.track(
        rawResponse,
        testLabel,
        rawResponse.url(),
        responseTime
      );

  const assert = new AssertionEngine();
  const validation = new ValidationEngine();
  const validator = new OrganisationHierarchyValidator();
  const data = OrganisationHierarchyMapper.mapData(responseBody.data);

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
  validation.execute("Org DTR Uniqueness", () =>
    validator.validateOrgDtrUniqueness(data.hierarchy),
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
