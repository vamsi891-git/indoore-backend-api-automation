import type { APIResponse } from "@playwright/test";
import { PerformanceTracker } from "../../../core/utils/performance.tracker";
import { OrganisationHierarchyApi } from "../Api/organizationhierarchy.api";
import {
  assetManagementHierarchyMaxResponseTimeMs,
  assetManagementHierarchyRequestTimeoutMs,
} from "../Data/asset-management.common.data";
import { OrganisationHierarchyMapper } from "../Mapper/organizationhierarchy.mapper";
import { OrganisationHierarchyValidator } from "../Validator/organizationhierarchy.validator";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

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
    maxResponseTimeMs = assetManagementHierarchyMaxResponseTimeMs,
    requestTimeoutMs = assetManagementHierarchyRequestTimeoutMs,
    includeSubtreeChecks = false,
    subtreeRootId,
  } = options;

  const { rawResponse, responseBody, responseTime } = await api.getOrganisationHierarchy(
    rootId,
    requestTimeoutMs,
  );

  await PerformanceTracker.track(rawResponse, testLabel, rawResponse.url(), responseTime);

  const assert = new ApiValidationHelper();
  const validation = new ApiValidationHelper();
  const validator = new OrganisationHierarchyValidator();
  const data = OrganisationHierarchyMapper.mapData(responseBody.data);

  validation.execute("Status Validation", () => assert.validateStatusCode(rawResponse, 200));
  validation.execute("Content Validation", () => assert.validateContentType(rawResponse));
  validation.execute("Response Time", () =>
    assert.validateResponseTime(responseTime, maxResponseTimeMs),
  );
  validation.execute("Security Validation", () => assert.validateSensitiveData(responseBody));
  validation.execute("Response Contract", () => validator.validateResponse(responseBody));
  validation.execute("Items", () => validator.validateItemsExist(data));
  validation.execute("Fields", () => validator.validateHierarchyFields(data.hierarchy));
  validation.execute("Duplicate IDs", () => validator.validateDuplicateIds(data.hierarchy));
  if (rootId == null) {
    validation.execute("Expected Levels", () => validator.validateExpectedLevels(data.hierarchy));
  }
  validation.execute("DTRs Not In Children", () =>
    validator.validateDtrsNotInChildren(data.hierarchy),
  );
  validation.execute("DTR Arrays", () => validator.validateDtrArrays(data.hierarchy));
  validation.execute("Org DTR Uniqueness", () =>
    validator.validateOrgDtrUniqueness(data.hierarchy),
  );

  if (includeSubtreeChecks && rootId != null) {
    validation.execute("Subtree Root", () => validator.validateSubtreeRoot(data.hierarchy, rootId));
  } else if (subtreeRootId != null) {
    validation.execute("Subtree Root", () =>
      validator.validateSubtreeRoot(data.hierarchy, subtreeRootId),
    );
  }

  validation.printSummary(testLabel, responseTime);

  return { rawResponse, responseTime, hierarchy: data.hierarchy };
}
