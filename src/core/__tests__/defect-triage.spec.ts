import { test, expect } from "@playwright/test";
import { buildHeuristicTriage } from "../ai/defect-heuristic-triage";
import { DeveloperReportEngine } from "../engine/developer-report.engine";

test.describe("defect-heuristic-triage", () => {
  test("classifies INTERNAL_ERROR 500 as backend_crash", () => {
    const result = buildHeuristicTriage({
      apiName: "Technical Summary",
      results: [
        {
          name: "Status Code",
          status: "FAIL",
          message: "Expected status 200 but received 500",
        },
      ],
      context: {
        module: "TECHNICAL-ANALYSIS",
        endpoint: "/indore/analysis/technical/summary",
        method: "GET",
        responseStatus: 500,
        responseBody: {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "An unexpected error occurred",
          },
        },
      },
    });

    expect(result.source).toBe("heuristic");
    expect(result.triage.classification).toBe("backend_crash");
    expect(result.triage.likelyOwner).toBe("backend");
    expect(result.triage.severity).toBe("high");
  });

  test("buildMarkdown includes triage section", () => {
    const markdown = DeveloperReportEngine.buildMarkdown({
      apiName: "Technical Summary",
      responseTimeMs: 1200,
      results: [
        {
          name: "Status Code",
          status: "FAIL",
          message: "Expected status 200 but received 500",
        },
        { name: "Content Type", status: "PASS" },
      ],
      context: {
        endpoint: "/indore/analysis/technical/summary",
        responseStatus: 500,
        responseBody: {
          success: false,
          error: { code: "INTERNAL_ERROR", message: "boom" },
        },
      },
    });

    expect(markdown).toContain("## AI / heuristic triage");
    expect(markdown).toContain("backend_crash");
    expect(markdown).toContain("INTERNAL_ERROR");
  });
});
