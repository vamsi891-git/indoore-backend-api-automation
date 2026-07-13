import type { APIResponse } from "@playwright/test";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { DtrDetailApi } from "../Api/DtrId.api";
import {
  assetManagementMaxResponseTimeMs,
  assetManagementPaths,
} from "../Data/asset-management.common.data";
import { DtrDetailMapper } from "../Mapper/dtrId.mapper";
import { DtrDetailValidator } from "../Validator/dtrId.validator";

export interface RunDtrDetailValidationOptions {
  api: DtrDetailApi;
  dtrId: number;
  page: number;
  limit: number;
  testLabel: string;
  maxResponseTimeMs?: number;
  skipConsumerChecks?: boolean;
  validateLastPage?: boolean;
}

export async function runDtrDetailValidation(
  options: RunDtrDetailValidationOptions,
): Promise<{
  rawResponse: APIResponse;
  responseTime: number;
  data: ReturnType<typeof DtrDetailMapper.mapData>;
}> {
  const {
    api,
    dtrId,
    page,
    limit,
    testLabel,
    maxResponseTimeMs = assetManagementMaxResponseTimeMs,
    skipConsumerChecks = false,
    validateLastPage = false,
  } = options;

  const { rawResponse, responseBody, responseTime } = await api.getDtrDetails(
    dtrId,
    page,
    limit,
  );

  await PerformanceTracker.track(
    rawResponse,
    testLabel,
    rawResponse.url(),
    responseTime,
  );

  const assert = new AssertionEngine();
  const validation = new ValidationEngine();
  const validator = new DtrDetailValidator();
  const data = DtrDetailMapper.mapData(responseBody.data);

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
  validation.execute("DTR", () => validator.validateDtrFields(data));
  validation.execute("Pagination", () => validator.validatePagination(data));
  validation.execute("Pagination Consistency", () =>
    validator.validatePaginationConsistency(data, page, limit),
  );

  if (validateLastPage) {
    validation.execute("Last Page Consumers", () =>
      validator.validateLastPageConsumers(data, page),
    );
  }

  if (!skipConsumerChecks) {
    validation.execute("Consumers", () => validator.validateConsumers(data));
    validation.execute("Consumer Field Coverage", () =>
      validator.validateConsumerFieldCoverage(data),
    );
    validation.execute("Meter Field Coverage", () =>
      validator.validateMeterFieldCoverage(data),
    );
    validation.execute("Duplicate Consumer", () =>
      validator.validateDuplicateConsumers(data),
    );
    validation.execute("Consumer Meter Uniqueness", () =>
      validator.validateConsumerMeterUniqueness(data),
    );
  }

  validation.printSummary(testLabel, responseTime);

  return { rawResponse, responseTime, data };
}
