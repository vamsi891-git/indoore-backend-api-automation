import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { CommercialSummaryApi } from "../Api/commercial-summary.api";
import { commercialSummaryData } from "../Data/commercial-summary.data";
import { CommercialSummaryMapper } from "../Mapper/commercial-summary.mapper";
import { CommercialSummaryValidator } from "../Validator/commercial-summary.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";

test.describe("Commercial Summary API", () => {
    test.describe.configure({ retries: 2 });
    test.setTimeout(480_000);

    test(
        "Validate Commercial Summary API",
        {
            tag: ["@commercial", "@commercial-summary", "@smoke"],
        },
        async ({ authenticatedApi }) => {
            const api = new CommercialSummaryApi(authenticatedApi);
            const {
                month,
                year,
                pfThreshold,
                maxResponseTime,
                expectedReportCount,
                expectedCategory,
                expectedAnalysisTypes,
                expectedReportNames,
                reportsExpectedAllZero,
                reportGroups,
            } = commercialSummaryData;

            const { rawResponse, responseBody, responseTime, attempts } =
                await api.getCommercialSummary(month, year, pfThreshold);

            await PerformanceTracker.track(
        rawResponse,
        "Commercial Summary API",
        rawResponse.url(),
        responseTime
      );

            const assert = new AssertionEngine();
            const validation = new ValidationEngine();
            const validator = new CommercialSummaryValidator();

            try {
                validation.execute("Status", () => {
                    if (
                        rawResponse.status() === 500 &&
                        responseBody?.error?.code === "INTERNAL_ERROR"
                    ) {
                        throw new Error(
                            `Expected status 200 but received 500 INTERNAL_ERROR after ${attempts} client retry attempt(s). Body: ${JSON.stringify(responseBody)}`,
                        );
                    }
                    assert.validateStatusCode(rawResponse, 200, responseBody);
                });
                validation.execute("Content Type", () =>
                    assert.validateContentType(rawResponse),
                );
                validation.execute("Response Time", () =>
                    assert.validateResponseTime(responseTime, maxResponseTime),
                );
                validation.execute("Sensitive Data", () =>
                    assert.validateSensitiveData(responseBody),
                );

                if (rawResponse.status() !== 200 || !responseBody.success) {
                    validation.execute("Error Envelope", () => {
                        expect(responseBody.success).toBe(false);
                        expect(responseBody.error?.code).toBeTruthy();
                    });
                    return;
                }

                const data = responseBody.data;
                validation.execute("Data Payload", () => {
                    expect(data).toBeDefined();
                });
                if (!data) {
                    return;
                }

                const summaryData = data;

                validation.execute("Required Fields", () =>
                    assert.validateRequiredFields(summaryData, [
                        "month",
                        "year",
                        "reports",
                    ]),
                );

                const mapped = CommercialSummaryMapper.map(responseBody);
                const { reports } = mapped;

                validation.execute("Success", () =>
                    validator.validateSuccess(mapped.success),
                );
                validation.execute("Root Structure", () =>
                    validator.validateRootStructure(mapped),
                );
                validation.execute("Month", () =>
                    validator.validateMonth(mapped.month),
                );
                validation.execute("Year", () =>
                    validator.validateYear(mapped.year),
                );
                validation.execute("Query Echo", () =>
                    validator.validateQueryEcho(mapped, month, year),
                );
                validation.execute("Reports Exist", () =>
                    validator.validateReportsExist(reports),
                );
                validation.execute("Report Count", () =>
                    validator.validateReportCount(reports, expectedReportCount),
                );
                validation.execute("Duplicate Analysis Types", () =>
                    validator.validateDuplicateAnalysisTypes(reports),
                );
                validation.execute("Expected Analysis Types", () =>
                    validator.validateExpectedAnalysisTypes(
                        reports,
                        expectedAnalysisTypes,
                    ),
                );
                validation.execute("Reports Order", () =>
                    validator.validateReportsOrder(reports, expectedAnalysisTypes),
                );
                validation.execute("Report Groups", () =>
                    validator.validateReportGroupsPresent(reports, reportGroups),
                );
                validation.execute("Commercial Category", () =>
                    validator.validateCommercialCategory(reports, expectedCategory),
                );
                validation.execute("Night Reports Placeholder", () =>
                    validator.validateNightReportsPlaceholder(
                        reports,
                        reportsExpectedAllZero,
                    ),
                );
                validation.execute("Aggregate Totals", () =>
                    validator.validateAggregateTotals(reports),
                );
                validation.execute("Likely Data Presence", () =>
                    validator.validateLikelyDataPresence(reports),
                );
                validation.execute("Business Rules", () =>
                    validator.validateBusinessRules(mapped),
                );
                reports.forEach((report) => {
                    const label = report.analysisType;
                    validation.execute(`${label} Required Fields`, () =>
                        validator.validateReportRequiredFields(report),
                    );
                    validation.execute(`${label} Field Whitelist`, () =>
                        validator.validateReportFieldWhitelist(report),
                    );
                    validation.execute(`${label} Structure`, () =>
                        validator.validateReportStructure(report),
                    );
                    validation.execute(`${label} Integer Counts`, () =>
                        validator.validateIntegerCounts(report),
                    );
                    validation.execute(`${label} Counts`, () =>
                        validator.validateReportCounts(report),
                    );
                    validation.execute(`${label} Zero Count Logic`, () =>
                        validator.validateZeroCountLogic(report),
                    );
                    validation.execute(`${label} Report Name`, () =>
                        validator.validateReportNameMapping(
                            report,
                            expectedReportNames,
                        ),
                    );
                    validation.execute(`${label} No NaN`, () =>
                        validator.validateNoNaN(report),
                    );
                    validation.execute(`${label} No Nullish Counts`, () =>
                        validator.validateNoNullishCounts(report),
                    );
                    validation.execute(`${label} Dom/Non-Dom Split`, () =>
                        validator.validateDomesticNonDomesticSplit(report),
                    );
                });
            } finally {
                validation.finalize("Commercial Summary API", responseTime);
            }
        },
    );
});
