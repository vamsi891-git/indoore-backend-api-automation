import { expect, type TestInfo } from "@playwright/test";
import { backendRules, labelMappings } from "../../modules/MIS DASHBOARDIES/Data/event-classification.data";
import { EventClassificationResponse, EventClassificationData } from "../../modules/MIS DASHBOARDIES/Mapper/event-classification.mapper";
import { ValidationResult } from "../models/resultModel";
import {
  DefectReportContext,
  DeveloperReportEngine,
} from "./developer-report.engine";

export interface PrintSummaryOptions {
  testInfo?: TestInfo;
  defectContext?: DefectReportContext;
}

export class ValidationEngine {
  private results: ValidationResult[] = [];

  // =====================================
  // EXECUTE VALIDATION
  // =====================================

  execute(
    validationName: string,

    validationFn: () => void,
  ): void {
    try {
      // ===============================
      // RUN VALIDATION
      // ===============================

      validationFn();

      // ===============================
      // STORE PASS RESULT
      // ===============================

      this.results.push({
        name: validationName,

        status: "PASS",
      });
    } catch (error: any) {
      // ===============================
      // STORE FAIL RESULT
      // ===============================

      this.results.push({
        name: validationName,

        status: "FAIL",

        message: error.message,
      });

      // ===============================
      // FAIL TEST
      // ===============================

      throw error;
    }
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
    const divider = "=".repeat(50);
    const finalStatus = this.getFailedCount() === 0 ? "PASS" : "FAIL";

    console.log(`\n${divider}`);
    console.log(`API TEST SUMMARY — ${apiName}`);
    console.log(divider);
    console.log(`RESPONSE TIME   : ${responseTime} ms`);
    console.log(`TOTAL CHECKS    : ${this.getTotalCount()}`);
    console.log(`PASSED          : ${this.getPassedCount()}`);
    console.log(`FAILED          : ${this.getFailedCount()}`);
    console.log(`FINAL STATUS    : ${finalStatus}`);
    console.log(divider);

    const failed = this.results.filter((r) => r.status === "FAIL");

    if (failed.length > 0) {
      console.log("FAILED VALIDATIONS:");
      failed.forEach((f, index) => {
        console.log(`  ${index + 1}. ${f.name}`);
        if (f.message) {
          console.log(`     Reason: ${f.message}`);
        }
      });
      console.log(divider);

      if (options?.defectContext) {
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

        console.log(`\nDEVELOPER DEFECT REPORT: ${reportPath}`);
        console.log(
          "Share this file with the backend team (Jira / Azure DevOps / GitHub).\n",
        );

        if (options.testInfo) {
          void DeveloperReportEngine.attachToTest(
            options.testInfo,
            reportPath,
            markdown,
          );
        }
      }
    }

    console.log(`VALIDATION CHECKS (${apiName}):`);
    this.results.forEach((r, index) => {
      console.log(`  ${index}. ${r.name} — ${r.status}`);
    });
    console.log(`${divider}\n`);
  }
}

export class EventClassificationValidator {

    validateResponse(

        response: EventClassificationResponse

    ) {

        expect(
            response.success
        )
            .toBeTruthy();

        expect(
            response.data
        )
            .toBeDefined();

    }

    validateReportType(

        data: EventClassificationData

    ) {

        expect(

            [
                "phase-wise",
                "category-wise"
            ]

        )

            .toContain(
                data.reportType
            );

    }

    validateDates(

        data: EventClassificationData

    ) {

        expect(
            data.currentDate
        )
            .toBeTruthy();

        expect(
            data.previousDate
        )
            .toBeTruthy();

        const current = new Date(
            data.currentDate
        );

        const previous = new Date(
            data.previousDate
        );

        expect(
            current.getTime()
        )

            .toBeGreaterThan(
                previous.getTime()
            );

    }

    validateTotals(

        data: EventClassificationData

    ) {

        const currentTotal = data.classifications
            .reduce(

                (sum, row) => sum +
                    row.currentDay,

                0

            );

        const previousTotal = data.classifications
            .reduce(

                (sum, row) => sum +
                    row.previousDay,

                0

            );

        expect(
            currentTotal
        )

            .toBe(
                data.totalEventsCurrentDay
            );

        expect(
            previousTotal
        )

            .toBe(
                data.totalEventsPreviousDay
            );

    }

    validateClassificationStructure(

        data: EventClassificationData

    ) {

        expect(
            data.classifications.length
        )

            .toBeGreaterThan(0);

        const categories = new Set();

        for (const row of data.classifications) {

            expect(
                row.category
            )
                .toBeTruthy();

            expect(
                row.label
            )
                .toBeTruthy();

            expect(
                row.currentDay
            )

                .toBeGreaterThanOrEqual(
                    0
                );

            expect(
                row.previousDay
            )

                .toBeGreaterThanOrEqual(
                    0
                );

            expect(

                categories.has(
                    row.category
                )

            )

                .toBeFalsy();

            categories.add(
                row.category
            );

        }

    }

    validateBackendLogic(

        data: EventClassificationData

    ) {

        const expected = backendRules[data.reportType as keyof typeof backendRules];
        const actual = data.classifications
            .map(
                x => x.category
            );

        expect(
            actual
        )

            .toEqual(
                expected
            );

    }

    validateLabelMappings(

        data: EventClassificationData

    ) {

        for (const row of data.classifications) {

            expect(
                row.label
            )

                .toBe(

                    labelMappings[row.category as keyof typeof labelMappings    ],

                );

        }

    }

}
