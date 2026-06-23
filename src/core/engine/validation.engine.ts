import { type TestInfo } from "@playwright/test";
import { ValidationResult } from "../models/resultModel";
import { DefectReportContext, DeveloperReportEngine,} from "./developer-report.engine";
export interface PrintSummaryOptions {
  testInfo?: TestInfo;
  defectContext?: DefectReportContext;
}

function isVerboseSummary(): boolean {
  const flag = process.env.API_TEST_VERBOSE_SUMMARY?.trim().toLowerCase();
  return flag === "1" || flag === "true" || flag === "yes";
}

function firstLine(message: string): string {
  return message.split("\n")[0]?.trim() ?? message;
}

export class ValidationEngine {
  private results: ValidationResult[] = [];
  // =====================================
  // EXECUTE VALIDATION
  // =====================================
  /**
   * Runs a validation and records pass/fail without stopping the test.
   * Call finalize() (or printSummary) at the end to print results and fail the test.
   */
  execute(validationName: string,validationFn: () => void,): void {
    try {
      validationFn();
      this.results.push({
        name: validationName,
        status: "PASS",
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : String(error);
      this.results.push({
        name: validationName,
        status: "FAIL",
        message,
      });
    }
  }

  /**
   * Alias for printSummary — use in a finally block so results always print.
   */
  finalize(apiName: string,responseTime: number,options?: PrintSummaryOptions,): void {
    this.printSummary(apiName, responseTime, options);
  }

  private assertAllPassed(): void {
    const failed = this.results.filter((r) => r.status === "FAIL");
    if (failed.length === 0) {
      return;
    }
    const lines = failed.map(
      (f, i) => `  ${i + 1}. ${f.name}${f.message ? `: ${f.message}` : ""}`,
    );
    throw new Error(
      `${failed.length} validation(s) failed:\n${lines.join("\n")}`,
    );
  }

  // =====================================
  // GET RESULTS
  // =====================================

  getResults(): ValidationResult[] {
    return this.results;
  }

  // =====================================
  // PASSED COUNT
  // =====================================

  getPassedCount(): number {
    return this.results.filter((r) => r.status === "PASS").length;
  }

  // =====================================
  // FAILED COUNT
  // =====================================

  getFailedCount(): number {
    return this.results.filter((r) => r.status === "FAIL").length;
  }

  // =====================================
  // TOTAL COUNT
  // =====================================

  getTotalCount(): number {
    return this.results.length;
  }

  // =====================================
  // PRINT SUMMARY
  // =====================================

  printSummary(
    apiName: string,
    responseTime: number,
    options?: PrintSummaryOptions,
  ): void {
    const failed = this.results.filter((r) => r.status === "FAIL");
    const finalStatus = failed.length === 0 ? "PASS" : "FAIL";

    if (isVerboseSummary()) {
      this.printVerboseBanner(apiName, responseTime, finalStatus);
    }

    this.printChecklist(apiName, responseTime, finalStatus, options);
    this.assertAllPassed();
  }

  private printChecklist(
    apiName: string,
    responseTime: number,
    finalStatus: "PASS" | "FAIL",
    options?: PrintSummaryOptions,
  ): void {
    console.log(
      `[${finalStatus}] ${apiName} — ${this.getPassedCount()}/${this.getTotalCount()} checks, ${responseTime}ms`,
    );

    this.results.forEach((result, index) => {
      console.log(`  ${index + 1}. ${result.name} — ${result.status}`);
      if (result.status === "FAIL" && result.message) {
        console.log(`     ${firstLine(result.message)}`);
      }
    });

    if (finalStatus === "FAIL") {
      this.writeDefectReportIfNeeded(apiName, responseTime, options);
    }
  }

  private printVerboseBanner(
    apiName: string,
    responseTime: number,
    finalStatus: "PASS" | "FAIL",
  ): void {
    const divider = "=".repeat(50);
    console.log(`\n${divider}`);
    console.log(`API TEST SUMMARY — ${apiName}`);
    console.log(divider);
    console.log(`RESPONSE TIME   : ${responseTime} ms`);
    console.log(`TOTAL CHECKS    : ${this.getTotalCount()}`);
    console.log(`PASSED          : ${this.getPassedCount()}`);
    console.log(`FAILED          : ${this.getFailedCount()}`);
    console.log(`FINAL STATUS    : ${finalStatus}`);
    console.log(divider);
  }

  private writeDefectReportIfNeeded(
    apiName: string,
    responseTime: number,
    options?: PrintSummaryOptions,
  ): void {
    if (!options?.defectContext) {
      return;
    }

    const markdown = DeveloperReportEngine.buildMarkdown({
      apiName,
      responseTimeMs: responseTime,
      results: this.results,
      context: options.defectContext,
      testTitle: options.testInfo?.title,
    });
    const reportPath = DeveloperReportEngine.write({
      apiName,
      responseTimeMs: responseTime,
      results: this.results,
      context: options.defectContext,
      testTitle: options.testInfo?.title,
    });

    console.log(`Defect report: ${reportPath}`);

    if (options.testInfo) {
      void DeveloperReportEngine.attachToTest(
        options.testInfo,
        reportPath,
        markdown,
      );
    }
  }
}
