import { test } from "../../../fixtures/api.fixture";
import { TechnicalSummaryApi } from "../Api/technical-summary.api";
import { technicalSummaryData } from "../Data/technical-summary.data";
import { TechnicalSummaryMapper } from "../Mapper/technical-summary.mapper";
import { TechnicalSummaryValidator } from "../Validator/technical-summary.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
test.describe("Technical Summary API",() => {
        test("Validate Technical Summary API",
            {
                tag: [
                    "@technical",
                    "@summary",
                    "@smoke"
                ]
            },
            async ({authenticatedApi}) => {
                const api =new TechnicalSummaryApi(authenticatedApi);
                const {
                    rawResponse,
                    responseBody,
                    responseTime
                } =await api.getTechnicalSummary(technicalSummaryData.month,technicalSummaryData.year);
                await PerformanceTracker.track(
                    rawResponse,
                    "Technical Summary API",
                    `${process.env.BASE_URL}/indore/analysis/technical/summary`,
                    responseTime
                );
                const assert = new AssertionEngine();
                const validation = new ValidationEngine();
                validation.execute("Status Code",() =>
                        assert.validateStatusCode(rawResponse,200)
                );
                validation.execute("Content Type",() =>
                        assert.validateContentType(rawResponse)
                );
                validation.execute("Response Time",() =>
                        assert.validateResponseTime(responseTime,30000)
                );
                validation.execute("Sensitive Data",() =>
                        assert.validateSensitiveData(responseBody)
                );
                const mapped =TechnicalSummaryMapper.map(responseBody);
                const validator =new TechnicalSummaryValidator();
                validation.execute("Month Validation",() =>
                        validator.validateMonth(mapped.month)
                );
                validation.execute("Year Validation",() =>
                        validator.validateYear(mapped.year)
                );
                validation.execute("Reports Validation",() =>
                        validator.validateReportsExist(mapped.reports)
                );
                validation.execute("Duplicate Analysis Validation",() =>
                        validator.validateDuplicateAnalysisTypes(mapped.reports)
                );
                validation.execute("Technical Category Validation",() =>
                        validator.validateTechnicalReports(mapped.reports)
                );
                validation.execute("YNR Category Validation",() =>
                        validator.validateYnrReports(mapped.reports)
                );
                mapped.reports.forEach(report => {
                        validation.execute(`${report.analysisType} Field Validation`,() =>
                                validator.validateFields(report)
                        );
                        validation.execute(`${report.analysisType} Type Validation`,() =>
                                validator.validateTypes(report)
                        );
                        validation.execute(`${report.analysisType} Count Validation`,() =>
                                validator.validateCounts(report)
                        );
                        validation.execute(`${report.analysisType} NaN Validation`,() =>
                                validator.validateNaN(report)
                        );
                        validation.execute(`${report.analysisType} Category Validation`,() =>
                                validator.validateCategory(report)
                        );
                        validation.execute(`${report.analysisType} Business Rule Validation`,() =>
                                validator.validateBusinessRules(report)
                        );
                        validation.execute(`${report.analysisType} Zero Count Validation`,() =>
                                validator.validateZeroCountLogic(report)
                        );
                        validation.execute(`${report.analysisType} Empty String Validation`,() =>
                                validator.validateEmptyStrings(report)
                        );
                    }
                );
                validation.printSummary("Technical Summary API",responseTime);
            }
        );
    }
);