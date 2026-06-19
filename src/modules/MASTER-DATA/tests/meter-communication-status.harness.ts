import { APIResponse } from "@playwright/test";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { MeterCommunicationStatusApi } from "../Api/meter-communication-status.api";
import { masterDataMaxResponseTimeMs } from "../Data/master-data.common.data";
import { MeterCommunicationStatusMapper } from "../Mapper/meter-communication-status.mapper";
import type { MeterCommunicationStatusQuery } from "../Mapper/meter-communication-status.mapper";
import { MeterCommunicationStatusValidator } from "../Validator/meter-communication-status.validator";

export interface RunMeterCommunicationValidationOptions {
  api: MeterCommunicationStatusApi;
  query: MeterCommunicationStatusQuery;
  testLabel: string;
  maxResponseTimeMs?: number;
  communicationStatusFilter?: string;
  searchTerm?: string;
  skipCommunicatingTimestampCheck?: boolean;
}

export async function runMeterCommunicationValidation(
  options: RunMeterCommunicationValidationOptions,
): Promise<{
  rawResponse: APIResponse;
  responseTime: number;
  firstNonNullSerial: string | null;
}> {
  const {
    api,
    query,
    testLabel,
    maxResponseTimeMs = masterDataMaxResponseTimeMs,
    communicationStatusFilter,
    searchTerm,
    skipCommunicatingTimestampCheck = false,
  } = options;

  const { rawResponse, responseBody, responseTime } =
    await api.getMeterCommunicationStatus(query);

  const qs = new URLSearchParams(
    Object.entries(query).reduce(
      (acc, [k, v]) => {
        if (v != null && v !== "") acc[k] = String(v);
        return acc;
      },
      {} as Record<string, string>,
    ),
  ).toString();

  await PerformanceTracker.track(
    rawResponse,
    testLabel,
    `${process.env.BASE_URL}/indore/master-data/meter-communication-status?${qs}`,
    responseTime,
  );

  const assert = new AssertionEngine();
  const validation = new ValidationEngine();
  const validator = new MeterCommunicationStatusValidator();
  const data = MeterCommunicationStatusMapper.mapData(
    responseBody.data,
    query.limit ?? 20,
  );

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
  validation.execute("Response", () => validator.validateResponse(responseBody));
  validation.execute("Summary Counts", () =>
    validator.validateSummaryCounts(data),
  );
  validation.execute("Columns", () => validator.validateColumns(data));
  validation.execute("Items", () => validator.validateItemsExist(data));
  validation.execute("Fields", () => validator.validateFields(data));
  validation.execute("Pagination", () => validator.validatePagination(data));
  validation.execute("Query Params", () =>
    validator.validateQueryParams(data, query),
  );
  validation.execute("Sl No Sequence", () => validator.validateSlNoSequence(data));
  validation.execute("Unique Meter Serials On Page", () =>
    validator.validateUniqueMeterSerialsOnPage(data),
  );
  validation.execute("Page Status Within Summary", () =>
    validator.validatePageStatusCountsWithinSummary(data),
  );
  validation.execute("Row Keys Match Columns", () =>
    validator.validateRowKeysMatchColumns(data),
  );

  if (communicationStatusFilter) {
    validation.execute("Communication Status Filter", () =>
      validator.validateCommunicationStatusFilter(
        data,
        communicationStatusFilter as "communicating" | "non-communicating" | "unknown",
      ),
    );
  }

  if (searchTerm) {
    validation.execute("Search Results", () =>
      validator.validateSearchResults(data, searchTerm),
    );
  }

  if (!skipCommunicatingTimestampCheck) {
    validation.execute("Communicating Timestamp Rule", () =>
      validator.validateCommunicatingRowsHaveTimestamp(data),
    );
  }

  validation.printSummary(testLabel, responseTime);

  const firstNonNullSerial =
    data.items.find((row) => row.meterSerialNumber?.trim())?.meterSerialNumber ??
    null;

  return { rawResponse, responseTime, firstNonNullSerial };
}
