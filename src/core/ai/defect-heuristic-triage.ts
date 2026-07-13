import type { ValidationResult } from "../models/resultModel";
import type {
  DefectReportContext,
  DefectTriage,
  DefectTriageResult,
} from "./defect-triage.types";

export interface HeuristicTriageInput {
  apiName: string;
  results: ValidationResult[];
  context: DefectReportContext;
  testTitle?: string;
}

function errorCode(body: unknown): string | undefined {
  if (!body || typeof body !== "object") {
    return undefined;
  }
  return (body as { error?: { code?: string } }).error?.code;
}

function joinedFailureText(results: ValidationResult[]): string {
  return results
    .filter((r) => r.status === "FAIL")
    .map((r) => `${r.name} ${r.message ?? ""}`)
    .join("\n")
    .toLowerCase();
}

/** Deterministic triage — always available, no API key required. */
export function buildHeuristicTriage(
  input: HeuristicTriageInput,
): DefectTriageResult {
  const status = input.context.responseStatus;
  const code = errorCode(input.context.responseBody);
  const failureText = joinedFailureText(input.results);
  const failed = input.results.filter((r) => r.status === "FAIL");
  const first = failed[0]?.name ?? "Validation";

  let triage: DefectTriage;

  if (status !== undefined && status >= 500) {
    triage = {
      title: `[${status}] ${input.apiName} — server error`,
      severity: status === 500 ? "high" : "critical",
      classification:
        code === "INTERNAL_ERROR" || status === 500
          ? "backend_crash"
          : "flaky_infra",
      likelyOwner: "backend",
      confidence: 0.9,
      summary:
        code === "INTERNAL_ERROR"
          ? "API returned INTERNAL_ERROR. Likely unhandled exception, SQL failure, or timeout in the service layer."
          : `API returned HTTP ${status}. Treat as backend/infra until proven otherwise.`,
      nextSteps: [
        "Reproduce with the same method, path, and query/body against the same BASE_URL.",
        "Check service/API logs for the request timestamp and stack trace.",
        "Confirm whether this endpoint is a known intermittent defect (soft-skip) or a new regression.",
        "Re-run the Playwright grep after a backend fix.",
      ],
      tags: ["http-5xx", code ?? "server-error", input.context.module ?? "api"].filter(
        Boolean,
      ) as string[],
    };
  } else if (status === 401 || status === 403) {
    triage = {
      title: `[${status}] ${input.apiName} — auth/permission`,
      severity: "medium",
      classification: "auth_permission",
      likelyOwner: status === 401 ? "qa" : "backend",
      confidence: 0.85,
      summary:
        status === 401
          ? "Unauthorized response. Token missing/expired/invalid, or fixture auth failed."
          : "Forbidden response. Role/permission catalog may deny this route for the test user.",
      nextSteps: [
        "Verify EMAIL/PASSWORD login and token refresh in global setup.",
        "Confirm the test user role has access to this module route.",
        "If 403 is expected for a negative case, set expectedStatus accordingly.",
      ],
      tags: ["auth", String(status), input.context.module ?? "api"],
    };
  } else if (status === 404) {
    triage = {
      title: `[404] ${input.apiName} — not found`,
      severity: "medium",
      classification: "not_found",
      likelyOwner: "backend",
      confidence: 0.75,
      summary:
        "Route or entity not found. Path typo, env mismatch, or missing seed data.",
      nextSteps: [
        "Compare endpoint path with Swagger/OpenAPI.",
        "Confirm BASE_URL environment and tenant data for the lookup IDs used.",
      ],
      tags: ["http-404", input.context.module ?? "api"],
    };
  } else if (status === 400 || /validation error|bad request/.test(failureText)) {
    triage = {
      title: `[${status ?? 400}] ${input.apiName} — validation`,
      severity: "low",
      classification: "validation_rejected",
      likelyOwner: failed.some((f) => /status code/i.test(f.name))
        ? "qa"
        : "backend",
      confidence: 0.7,
      summary:
        "Request rejected as invalid, or test expected a different validation outcome.",
      nextSteps: [
        "Compare request params with OpenAPI required fields and enums.",
        "If this is a negative test, assert the error envelope instead of 200.",
      ],
      tags: ["http-400", input.context.module ?? "api"],
    };
  } else if (/response time|timeout/.test(failureText)) {
    triage = {
      title: `${input.apiName} — performance`,
      severity: "medium",
      classification: "performance",
      likelyOwner: "backend",
      confidence: 0.8,
      summary: "Response exceeded the module SLA threshold.",
      nextSteps: [
        "Check DB/query cost for this report/widget.",
        "Confirm CI/network latency vs local runs.",
      ],
      tags: ["performance", input.context.module ?? "api"],
    };
  } else if (
    /expected status|status code/.test(failureText) &&
    status !== undefined &&
    status !== 200
  ) {
    triage = {
      title: `[${status}] ${input.apiName} — unexpected status`,
      severity: "high",
      classification: "contract_mismatch",
      likelyOwner: "backend",
      confidence: 0.8,
      summary: `Test expected success but received HTTP ${status}${code ? ` (${code})` : ""}.`,
      nextSteps: [
        "Inspect response body for error.code / message.",
        "Decide: backend bug, wrong test fixture data, or expectedStatus update.",
      ],
      tags: ["status-mismatch", code ?? String(status), input.context.module ?? "api"],
    };
  } else {
    triage = {
      title: `${input.apiName} — ${first}`,
      severity: "medium",
      classification: "contract_mismatch",
      likelyOwner: "backend",
      confidence: 0.55,
      summary:
        failed[0]?.message?.split("\n")[0] ??
        "Business/contract assertion failed while HTTP may still be 200.",
      nextSteps: [
        "Diff actual JSON fields against mapper/validator expectations.",
        "Confirm fixture month/year/IDs still exist in this environment.",
        "Share this defect report with the API owner for the module.",
      ],
      tags: ["contract", input.context.module ?? "api", first],
    };
  }

  if (input.context.expectedBehavior) {
    triage.nextSteps = [
      `Expected behavior: ${input.context.expectedBehavior}`,
      ...triage.nextSteps,
    ].slice(0, 8);
  }

  return { triage, source: "heuristic" };
}
