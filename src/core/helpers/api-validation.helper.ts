import { APIResponse, type TestInfo } from "@playwright/test";
import { AssertionEngine } from "../engine/assertion.engine";
import { ValidationEngine } from "../engine/validation.engine";
import type { DefectReportContext } from "../engine/developer-report.engine";
import { BackendResponse } from "../utils/backend-response.util";
import { DEFAULT_REQUEST_TIMEOUT_MS } from "../constants/api-timeouts";
import {
  printApiResponse,
  shouldPrintResponseAlways,
} from "../utils/response-console.util";

export interface StandardApiValidationOptions {
  apiName: string;
  rawResponse: APIResponse;
  responseBody: unknown;
  responseTime: number;
  expectedStatus?: number;
  maxResponseTimeMs?: number;
  logServerErrors?: boolean;
}

export class ApiValidationHelper {
  static runStandardChecks(
    validation: ValidationEngine,
    assert: AssertionEngine,
    options: StandardApiValidationOptions
  ): void {
    const {
      apiName,
      rawResponse,
      responseBody,
      responseTime,
      expectedStatus = 200,
      maxResponseTimeMs = DEFAULT_REQUEST_TIMEOUT_MS,
      logServerErrors = true
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
      assert.validateStatusCode(rawResponse, expectedStatus, responseBody)
    );
    validation.execute("Content Type", () =>
      assert.validateContentType(rawResponse, "application/json")
    );
    validation.execute("Response Time", () =>
      assert.validateResponseTime(responseTime, maxResponseTimeMs)
    );
    validation.execute("Sensitive Data", () =>
      assert.validateSensitiveData(responseBody)
    );
  }

  /** Call at end of test — prints summary and writes developer defect report on failure */
  static finalize(
    validation: ValidationEngine,
    options: {
      apiName: string;
      responseTime: number;
      testInfo?: TestInfo;
      defectContext: DefectReportContext;
    },
  ): void {
    if (validation.getFailedCount() > 0) {
      printApiResponse({
        apiName: options.apiName,
        status: options.defectContext.responseStatus,
        body: options.defectContext.responseBody,
        requestParams: options.defectContext.requestParams,
      });
    }

    validation.printSummary(options.apiName, options.responseTime, {
      testInfo: options.testInfo,
      defectContext: options.defectContext,
    });
  }
}
