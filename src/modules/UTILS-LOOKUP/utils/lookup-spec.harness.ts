import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { BackendResponse } from "../../../core/utils/backend-response.util";
import {
  UTILS_LOOKUP_MAX_RESPONSE_TIME_MS,
} from "../../../core/constants/api-timeouts";
import type { APIResponse } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import {
  UtilsLookupSharedValidator,
  type UtilsLookupErrorBody,
} from "../Validator/utils-lookup.shared";

export interface LookupApiResult {
  rawResponse: APIResponse;
  responseBody: unknown;
  responseTime: number;
}

export interface LookupTestCase {
  testName: string;
  tags: string[];
  expectedStatus?: number;
  /** When non-200: validate JSON error envelope vs status-only (HTML 404 probes). */
  errorExpectation?: "validation-error" | "status-only";
}

export interface LookupEnvelope<T = unknown> {
  success?: boolean;
  data?: T;
}

/** Typed `data` payload from a lookup success envelope (defaults to `{}`). */
export function getLookupResponseData<T>(responseBody: unknown): T {
  return ((responseBody as LookupEnvelope<T>).data ?? {}) as T;
}

export type LookupQueryParams = Record<string, string | number | undefined>;

export interface LookupSuccessContext {
  validation: ValidationEngine;
  assert: AssertionEngine;
  shared: UtilsLookupSharedValidator;
  responseBody: unknown;
  rawResponse: APIResponse;
  responseTime: number;
}

export async function runLookupApiTest(options: {
  testCase: LookupTestCase;
  /** Optional label only; request URL comes from rawResponse.url(). */
  endpoint?: string;
  fetch: () => Promise<LookupApiResult>;
  onSuccess?: (ctx: LookupSuccessContext) => void;
  skipContentTypeCheck?: boolean;
}): Promise<void> {
  const expectedStatus = options.testCase.expectedStatus ?? 200;
  const validation = new ValidationEngine();
  const assert = new AssertionEngine();
  const shared = new UtilsLookupSharedValidator();

  const { rawResponse, responseBody, responseTime } = await options.fetch();
  const requestUrl =
    rawResponse.url() ||
    (options.endpoint
      ? `${process.env.BASE_URL ?? ""}${options.endpoint}`
      : options.testCase.testName);

  if (
    expectedStatus === 200 &&
    BackendResponse.shouldSkipRateLimit(
      rawResponse.status(),
      options.testCase.testName,
    )
  ) {
    test.skip(
      true,
      `Rate limited (429) on ${requestUrl} — retry UTILS-LOOKUP suite later`,
    );
    return;
  }

  await PerformanceTracker.track(
        rawResponse,
        options.testCase.testName,
        rawResponse.url(),
        responseTime
      );

  if (
    BackendResponse.isServerError(rawResponse.status()) &&
    expectedStatus === 200
  ) {
    BackendResponse.logFinding(
      options.testCase.testName,
      rawResponse.status(),
      responseBody,
    );
  }

  validation.execute("Status Validation", () =>
    assert.validateStatusCode(rawResponse, expectedStatus, responseBody),
  );
  if (!options.skipContentTypeCheck && expectedStatus === 200) {
    validation.execute("Content Type", () =>
      assert.validateContentType(rawResponse),
    );
  }
  validation.execute("Response Time", () =>
    assert.validateResponseTime(
      responseTime,
      UTILS_LOOKUP_MAX_RESPONSE_TIME_MS,
    ),
  );
  if (expectedStatus === 200) {
    validation.execute("Sensitive Data", () =>
      assert.validateSensitiveData(responseBody),
    );
  }

  if (expectedStatus !== 200) {
    const errorExpectation =
      options.testCase.errorExpectation ?? "validation-error";
    if (errorExpectation === "validation-error") {
      validation.execute("Validation Error", () =>
        shared.validateValidationError(responseBody as UtilsLookupErrorBody),
      );
    }
    validation.printSummary(options.testCase.testName, responseTime);
    return;
  }

  validation.execute("Success Envelope", () =>
    shared.validateSuccessEnvelope(
      responseBody as { success?: boolean; data?: unknown },
    ),
  );

  options.onSuccess?.({
    validation,
    assert,
    shared,
    responseBody,
    rawResponse,
    responseTime,
  });

  validation.printSummary(options.testCase.testName, responseTime);
}

export function buildQueryString(query: object): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}
