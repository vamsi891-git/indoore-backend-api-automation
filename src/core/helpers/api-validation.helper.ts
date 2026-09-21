import { APIResponse, type TestInfo } from "@playwright/test";
import { AssertionEngine } from "../engine/assertion.engine";
import { ValidationEngine, type PrintSummaryOptions } from "../engine/validation.engine";
import type { DefectReportContext } from "../engine/developer-report.engine";
import { BackendResponse } from "../utils/backend-response.util";
import { DEFAULT_REQUEST_TIMEOUT_MS } from "../constants/api-timeouts";
import { printApiResponse, shouldPrintResponseAlways } from "../utils/response-console.util";
import type { ObsContext } from "../../extras/observability/context";
import type { ValidationResult } from "../models/result.model";
import { assertNonEmpty as assertRowsNonEmpty } from "../utils/assert-non-empty.util";

export interface StandardApiValidationOptions {
  apiName: string;
  rawResponse: APIResponse;
  responseBody: unknown;
  responseTime: number;
  expectedStatus?: number;
  maxResponseTimeMs?: number;
  logServerErrors?: boolean;
}

export interface FinalizeOptions {
  apiName: string;
  responseTime: number;
  testInfo?: TestInfo;
  defectContext?: DefectReportContext;
}

type ExecuteHost = {
  execute: (name: string, fn: () => void) => void;
};

type AssertHost = {
  validateStatusCode: AssertionEngine["validateStatusCode"];
  validateContentType: AssertionEngine["validateContentType"];
  validateResponseTime: AssertionEngine["validateResponseTime"];
  validateSensitiveData: AssertionEngine["validateSensitiveData"];
};

function applyStandardChecks(
  validation: ExecuteHost,
  assert: AssertHost,
  options: StandardApiValidationOptions,
): void {
  const {
    apiName,
    rawResponse,
    responseBody,
    responseTime,
    expectedStatus = 200,
    maxResponseTimeMs = DEFAULT_REQUEST_TIMEOUT_MS,
    logServerErrors = true,
  } = options;

  if (logServerErrors && BackendResponse.isServerError(rawResponse.status())) {
    BackendResponse.logFinding(apiName, rawResponse.status(), responseBody);
  }

  if (shouldPrintResponseAlways()) {
    printApiResponse({
      apiName,
      status: rawResponse.status(),
      body: responseBody,
    });
  }

  validation.execute("Status", () =>
    assert.validateStatusCode(rawResponse, expectedStatus, responseBody),
  );
  validation.execute("Content Type", () =>
    assert.validateContentType(rawResponse, "application/json"),
  );
  validation.execute("Response Time", () =>
    assert.validateResponseTime(responseTime, maxResponseTimeMs),
  );
  validation.execute("Sensitive Data", () => assert.validateSensitiveData(responseBody));
}

/**
 * Canonical assertion API for specs. Owns ValidationEngine + AssertionEngine.
 * Specs must not import those engines directly.
 */
export class ApiValidationHelper implements ExecuteHost, AssertHost {
  private readonly validation: ValidationEngine;
  private readonly assert: AssertionEngine;

  constructor(obs?: ObsContext) {
    this.validation = new ValidationEngine(obs);
    this.assert = new AssertionEngine();
  }

  runStandardChecks(options: StandardApiValidationOptions): void {
    applyStandardChecks(this, this, options);
  }

  /**
   * Extra named check (Zod, columns, uniqueness, totals, negatives).
   * Failures are recorded; call finalize() at the end.
   */
  execute(validationName: string, validationFn: () => void): void {
    this.validation.execute(validationName, validationFn);
  }

  recordContract(input: Parameters<ValidationEngine["recordContract"]>[0]): void {
    this.validation.recordContract(input);
  }

  validateStatusCode(response: APIResponse, expectedStatus: number, responseBody?: unknown): void {
    this.assert.validateStatusCode(response, expectedStatus, responseBody);
  }

  validateContentType(response: APIResponse, expectedType: string = "application/json"): void {
    this.assert.validateContentType(response, expectedType);
  }

  validateResponseTime(responseTime: number, maxTime: number): void {
    this.assert.validateResponseTime(responseTime, maxTime);
  }

  validateNotEmpty(data: unknown[]): void {
    this.assert.validateNotEmpty(data);
  }

  /**
   * Smoke-only: primary list/table must have rows.
   * Call inside `execute` when the Data case has `nonEmptyExpected: true`.
   */
  assertNonEmpty(rows: readonly unknown[] | null | undefined, label: string): void {
    assertRowsNonEmpty(rows, label);
  }

  /** No-op unless `nonEmptyExpected` is true (smoke). */
  assertPrimaryRowsIfExpected(
    nonEmptyExpected: boolean | undefined,
    rows: readonly unknown[] | null | undefined,
    label: string,
  ): void {
    if (nonEmptyExpected) {
      assertRowsNonEmpty(rows, label);
    }
  }

  validateRequiredFields(json: object, fields: string[]): void {
    this.assert.validateRequiredFields(json, fields);
  }

  validateSensitiveData(json: unknown): void {
    this.assert.validateSensitiveData(json);
  }

  assertValidationResults(results: ValidationResult[]): void {
    this.assert.assertValidationResults(results);
  }

  getResults(): ValidationResult[] {
    return this.validation.getResults();
  }

  getFailedCount(): number {
    return this.validation.getFailedCount();
  }

  getPassedCount(): number {
    return this.validation.getPassedCount();
  }

  getTotalCount(): number {
    return this.validation.getTotalCount();
  }

  finalize(
    apiNameOrOptions: string | FinalizeOptions,
    responseTime?: number,
    options?: PrintSummaryOptions,
  ): void {
    if (typeof apiNameOrOptions === "object") {
      const opts = apiNameOrOptions;
      if (this.getFailedCount() > 0) {
        printApiResponse({
          apiName: opts.apiName,
          status: opts.defectContext?.responseStatus,
          body: opts.defectContext?.responseBody,
          requestParams: opts.defectContext?.requestParams,
        });
      }
      this.validation.printSummary(opts.apiName, opts.responseTime, {
        testInfo: opts.testInfo,
        defectContext: opts.defectContext,
      });
      return;
    }
    this.validation.finalize(apiNameOrOptions, responseTime ?? 0, options);
  }

  finalizeAsync(
    apiName: string,
    responseTime: number,
    options?: PrintSummaryOptions,
  ): Promise<void> {
    return this.validation.finalizeAsync(apiName, responseTime, options);
  }

  /** @deprecated Use finalize(). Kept so existing call sites keep working. */
  printSummary(apiName: string, responseTime: number, options?: PrintSummaryOptions): void {
    this.validation.printSummary(apiName, responseTime, options);
  }

  static runStandardChecks(
    validation: ExecuteHost,
    assert: AssertHost,
    options: StandardApiValidationOptions,
  ): void {
    applyStandardChecks(validation, assert, options);
  }

  static finalize(
    validation: {
      getFailedCount: () => number;
      printSummary: ValidationEngine["printSummary"];
    },
    options: FinalizeOptions,
  ): void {
    if (validation.getFailedCount() > 0) {
      printApiResponse({
        apiName: options.apiName,
        status: options.defectContext?.responseStatus,
        body: options.defectContext?.responseBody,
        requestParams: options.defectContext?.requestParams,
      });
    }

    validation.printSummary(options.apiName, options.responseTime, {
      testInfo: options.testInfo,
      defectContext: options.defectContext,
    });
  }
}
