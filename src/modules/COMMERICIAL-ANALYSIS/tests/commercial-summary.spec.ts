import { test } from "../../../fixtures/api.fixture";
import { CommercialSummaryApi } from "../Api/commercial-summary.api";
import { commercialSummaryData } from "../Data/commercial-summary.data";
import { CommercialSummaryMapper } from "../Mapper/commercial-summary.mapper";
import { CommercialSummaryValidator } from "../Validator/commercial-summary.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";

test.describe("Commercial Summary API", () => {
    test.setTimeout(180_000);

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

            const { rawResponse, responseBody, responseTime } =
                await api.getCommercialSummary(month, year, pfThreshold);

            await PerformanceTracker.track(
                rawResponse,
                "Commercial Summary API",
                `${process.env.BASE_URL}/indore/analysis/commercial/summary?month=${month}&year=${year}&pfThreshold=${pfThreshold}`,
                responseTime,
            );

            const assert = new AssertionEngine();
            const validation = new ValidationEngine();
            const validator = new CommercialSummaryValidator();

            validation.execute("Status", () =>
                assert.validateStatusCode(rawResponse, 200, responseBody),
            );
            validation.execute("Content Type", () =>
                assert.validateContentType(rawResponse),
            );
            validation.execute("Response Time", () =>
                assert.validateResponseTime(responseTime, maxResponseTime),
            );
            validation.execute("Sensitive Data", () =>
                assert.validateSensitiveData(responseBody),
            );
            validation.execute("Required Fields", () =>
                assert.validateRequiredFields(responseBody.data, [
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
            validation.execute("Month", () => validator.validateMonth(mapped.month));
            validation.execute("Year", () => validator.validateYear(mapped.year));
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

            validation.printSummary("Commercial Summary API", responseTime);
        },
    );
});
