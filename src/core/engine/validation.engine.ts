import { type TestInfo } from "@playwright/test";
import { ValidationResult } from "../models/resultModel";
import type { DefectReportContext } from "../ai/defect-triage.types";
import { DeveloperReportEngine } from "./developer-report.engine";
import { isDefectLlmEnabled } from "../ai/defect-llm-triage";

export type { DefectReportContext };

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

  /**
   * Runs a validation and records pass/fail without stopping the test.
   * Call finalize() (or printSummary) at the end to print results and fail the test.
   */
  execute(validationName: string, validationFn: () => void): void {
    try {
      validationFn();
      this.results.push({
        name: validationName,
        status: "PASS",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.results.push({
        name: validationName,
        status: "FAIL",
        message,
      });
    }
  }

  /**
   * Alias for printSummary — use in a finally block so results always print.
   * Writes a heuristic defect triage report on failure (no API key required).
   * For optional LLM enrichment, use finalizeAsync when DEFECT_LLM_ENABLED=1.
   */
  finalize(
    apiName: string,
    responseTime: number,
    options?: PrintSummaryOptions,
  ): void {
    this.printSummary(apiName, responseTime, options);
  }

  /**
   * Same checklist + assert as finalize, but awaits optional LLM triage
   * when DEFECT_LLM_ENABLED=1 and an API key is configured.
   */
  async finalizeAsync(
    apiName: string,
    responseTime: number,
    options?: PrintSummaryOptions,
  ): Promise<void> {
    await this.printSummaryAsync(apiName, responseTime, options);
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

  getResults(): ValidationResult[] {
    return this.results;
  }

  getPassedCount(): number {
    return this.results.filter((r) => r.status === "PASS").length;
  }

  getFailedCount(): number {
    return this.results.filter((r) => r.status === "FAIL").length;
  }

  getTotalCount(): number {
    return this.results.length;
  }

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

    this.printChecklist(apiName, responseTime, finalStatus);

    if (finalStatus === "FAIL") {
      this.writeDefectReportSync(apiName, responseTime, options);
    }

    this.assertAllPassed();
  }

  async printSummaryAsync(
    apiName: string,
    responseTime: number,
    options?: PrintSummaryOptions,
  ): Promise<void> {
    const failed = this.results.filter((r) => r.status === "FAIL");
    const finalStatus = failed.length === 0 ? "PASS" : "FAIL";

    if (isVerboseSummary()) {
      this.printVerboseBanner(apiName, responseTime, finalStatus);
    }

    this.printChecklist(apiName, responseTime, finalStatus);

    if (finalStatus === "FAIL") {
      await this.writeDefectReportAsync(apiName, responseTime, options);
    }

    this.assertAllPassed();
  }

  private printChecklist(
    apiName: string,
    responseTime: number,
    finalStatus: "PASS" | "FAIL",
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

  private buildReportInput(
    apiName: string,
    responseTime: number,
    options?: PrintSummaryOptions,
  ) {
    const context: DefectReportContext = options?.defectContext ?? {
      endpoint: "(not provided — pass defectContext for richer reports)",
      expectedBehavior:
        "See failed validations. Prefer passing endpoint, status, and responseBody via defectContext.",
    };

    return {
      apiName,
      responseTimeMs: responseTime,
      results: this.results,
      context,
      testTitle: options?.testInfo?.title,
    };
  }

  private writeDefectReportSync(
    apiName: string,
    responseTime: number,
    options?: PrintSummaryOptions,
  ): void {
    const input = this.buildReportInput(apiName, responseTime, options);
    const triage = DeveloperReportEngine.resolveTriageSync(input);
    const { reportPath, triagePath } = DeveloperReportEngine.write({
      ...input,
      triage,
    });

    console.log(`Defect report: ${reportPath}`);
    console.log(
      `Defect triage: ${triagePath} [${triage.source}] ${triage.triage.classification}/${triage.triage.severity}`,
    );

    if (isDefectLlmEnabled()) {
      console.log(
        "Defect LLM is enabled — use validation.finalizeAsync(...) to await LLM enrichment.",
      );
    }

    if (options?.testInfo) {
      const markdown = DeveloperReportEngine.buildMarkdown({
        ...input,
        triage,
      });
      void DeveloperReportEngine.attachToTest(
        options.testInfo,
        reportPath,
        markdown,
        triagePath,
        triage,
      );
    }
  }

  private async writeDefectReportAsync(
    apiName: string,
    responseTime: number,
    options?: PrintSummaryOptions,
  ): Promise<void> {
    const input = this.buildReportInput(apiName, responseTime, options);
    const { reportPath, triagePath, triage } =
      await DeveloperReportEngine.writeWithOptionalLlm(input);

    console.log(`Defect report: ${reportPath}`);
    console.log(
      `Defect triage: ${triagePath} [${triage.source}] ${triage.triage.classification}/${triage.triage.severity}`,
    );

    if (options?.testInfo) {
      const markdown = DeveloperReportEngine.buildMarkdown({
        ...input,
        triage,
      });
      await DeveloperReportEngine.attachToTest(
        options.testInfo,
        reportPath,
        markdown,
        triagePath,
        triage,
      );
    }
  }
}
