import { ValidationResult } from "../models/resultModel";
export class SummaryEngine {
  printSummary(
    apiName: string,
    responseTime: number,
    results: ValidationResult[],
  ): void {
    const passed = results.filter((r) => r.status === "PASS");
    const failed = results.filter((r) => r.status === "FAIL");
    console.log(`

==================================================
API TEST SUMMARY
==================================================

API NAME        : ${apiName}

RESPONSE TIME   : ${responseTime} ms

TOTAL CHECKS    : ${results.length}

PASSED          : ${passed.length}

FAILED          : ${failed.length}

FINAL STATUS    :
${failed.length === 0 ? "PASS" : "FAIL"}

==================================================
`);

    // =====================================
    // FAILED VALIDATIONS
    // =====================================

    if (failed.length > 0) {
      console.log(`
FAILED VALIDATIONS:
`);

      failed.forEach((f, index) => {
        console.log(
          `${index + 1}.
           ${f.name}`,
        );

        if (f.message) {
          console.log(
            `Reason:
             ${f.message}`,
          );
        }
      });
    }

    // =====================================
    // CONSOLE TABLE
    // =====================================

    console.table(
      results.map((r) => ({
        Validation: r.name,

        Status: r.status,
      })),
    );
  }
}
