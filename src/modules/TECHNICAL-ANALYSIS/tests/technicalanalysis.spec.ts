import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { TechnicalReportApi } from "../Api/technicalanalysis.api";
import { TechnicalAnalysisData, type TechnicalAnalysisConfig,} from "../Data/technicalanalysis.data";
import { TechnicalReportMapper} from "../Mapper/technicalanalysis.mapper";
import {  TechnicalReportValidator} from "../Validator/technical-analysis.shared";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker }  from "../../../core/utils/performancetracker";
import { BackendResponse } from "../../../core/utils/backend-response.util";
import { TECHNICAL_ANALYSIS_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";

test.describe("Technical Analysis Report API",() => {
        test.describe.configure({ mode: "serial", retries: 2 });
        test.setTimeout(TECHNICAL_ANALYSIS_TEST_TIMEOUT_MS);

        TechnicalAnalysisData.forEach(
            (report: TechnicalAnalysisConfig) => {
                test(`${report.analysisType} Report Validation`,
                    {
                        tag: [
                            "@technical-analysis",
                            "@report",
                            "@smoke"
                        ]
                    },
                    async ({authenticatedApi}) => {
                        const api =new TechnicalReportApi(authenticatedApi);
                        const {
                            rawResponse,
                            responseBody,
                            responseTime
                        } = await api.getTechnicalReport(report.analysisType,report.month,report.year,report.pageSize);
                        await PerformanceTracker.track(
                            rawResponse,
                            `Technical Analysis - ${report.analysisType}`,
                            `${process.env.BASE_URL}/indore/analysis/technical/report?analysisType=${report.analysisType}&month=${report.month}&year=${report.year}&category=total&pageSize=${report.pageSize}`,
                            responseTime
                        );

                        if (BackendResponse.isServerError(rawResponse.status())) {
                            BackendResponse.logFinding(
                                `Technical Analysis - ${report.analysisType}`,
                                rawResponse.status(),
                                responseBody,
                            );
                        }

                        const assert = new AssertionEngine();
                        const validation = new ValidationEngine();
                        // =====================================
                        // API VALIDATIONS
                        // =====================================
                        validation.execute("Status Code Validation",() =>
                                assert.validateStatusCode(rawResponse,200)
                        );
                        validation.execute("Content Type Validation",() =>
                                assert.validateContentType(rawResponse)
                        );
                        validation.execute("Response Time Validation",() =>
                                assert.validateResponseTime(responseTime,report.maxResponseTime)
                        );
                        validation.execute("Sensitive Data Validation",() =>
                                assert.validateSensitiveData(responseBody)
                        );
                        // =====================================
                        // SUCCESS VALIDATION
                        // =====================================
                        validation.execute("Success Validation",() => {
                                expect(responseBody.success,"API Success Validation",).toBeTruthy();
                            },
                        );

                        if (rawResponse.status() !== 200 || !responseBody.success) {
                            validation.printSummary(
                                `${report.analysisType} Report API`,
                                responseTime,
                            );
                            return;
                        }

                        // =====================================
                        // MAPPER
                        // =====================================
                        const mapped = TechnicalReportMapper.map(responseBody, {
                            analysisType: report.analysisType,
                            month: report.month,
                            year: report.year,
                            pageSize: report.pageSize,
                            category: "total",
                        });
                        const validator =new TechnicalReportValidator();
                        // =====================================
                        // ROOT VALIDATIONS
                        // =====================================
                        validation.execute("Response Structure Validation",() =>
                                validator.validateResponseStructure(mapped)
                        );
                        validation.execute("Analysis Type Validation",() =>
                                validator.validateAnalysisType(mapped.analysisType,report.analysisType,)
                        );
                        validation.execute("Month Validation",() =>
                                validator.validateMonth(mapped.month,report.month)
                        );
                        validation.execute("Year Validation",() =>
                                validator.validateYear(mapped.year,report.year)
                        );
                        validation.execute("Pagination Validation",() =>
                                validator.validatePagination(mapped)
                        );
                        validation.execute("Pagination Consistency Validation",() =>
                                validator.validatePaginationConsistency(mapped)
                        );
                        validation.execute("Cross Field Validation",() =>
                                validator.validateCrossFieldLogic(mapped )
                        );
                        // =====================================
                        // NO DATA SCENARIO
                        // =====================================
                        if (!report.hasData) {
                            validation.execute("No Data Validation",() =>
                                    validator.validateNoDataScenario(mapped)
                            );
                            validation.printSummary(`${report.analysisType} Report API`,responseTime);
                            return;
                        }
                        // =====================================
                        // ROW VALIDATIONS
                        // =====================================
                        mapped.rows.forEach((row,index) => {
                                validation.execute(`Row ${index + 1} Structure Validation`,() =>
                                        validator.validateRowStructure(row)
                                );
                                validation.execute(`Row ${index + 1} Type Validation`,() =>
                                        validator.validateRowTypes(row)
                                );
                                validation.execute(`Row ${index + 1} Null Validation`,() =>
                                        validator.validateNulls(row)
                                );

                                validation.execute(`Row ${index + 1} Undefined Validation`,() =>
                                        validator.validateUndefined(row)
                                );
                                validation.execute(`Row ${index + 1} Empty Validation`,() =>
                                        validator.validateEmptyStrings(row)
                                );
                                validation.execute(`Row ${index + 1} NaN Validation`,() =>
                                        validator.validateNaN(row)
                                );
                            }
                        );
                        // =====================================
                        // DUPLICATE VALIDATIONS
                        // =====================================
                        validation.execute("Duplicate Meter Id Validation",() =>
                                validator.validateDuplicateMeterIds(mapped.rows)
                        );
                        validation.execute("Duplicate MSN Validation",() =>
                                validator.validateDuplicateMSN(mapped.rows)
                        );
                        validation.execute("Duplicate IVRS Validation",() =>
                                validator.validateDuplicateIVRS(mapped.rows)
                        );
                        validation.execute("Duplicate Meter Event Validation",() =>
                                validator.validateDuplicateMeterEvent(mapped.rows)
                        );
                        validation.execute("Duplicate Row Validation",() =>
                                validator.validateDuplicateRows(mapped.rows)
                        );
                        // =====================================
                        // BUSINESS RULE VALIDATIONS
                        // =====================================
                        switch (
                            report.validationType
                        ) {
                            case "duration100":
                                validation.execute("Duration Type Validation",() =>
                                        validator.validateDurationType(mapped.rows)
                                );
                                validation.execute("Duration > 100 Validation",() =>
                                        validator.validateDuration100(mapped.rows)
                                );
                                break;
                            case "duration12":
                                validation.execute("Duration Type Validation",() =>
                                        validator.validateDurationType(mapped.rows)
                                );
                                validation.execute("Duration >= 12 Validation",() =>
                                        validator.validateDuration12(mapped.rows)
                                );
                                break;
                            case "duration10":
                                validation.execute("Duration Type Validation",() =>
                                        validator.validateDurationType(mapped.rows)
                                );
                                validation.execute("Duration >= 10 Validation",() =>
                                        validator.validateDuration10(mapped.rows)
                                );
                                break;
                            case "count":
                                validation.execute("Count Report Validation",() =>
                                        validator.validateCountReport(mapped.rows)
                                );
                                break;
                            case "phase":
                                validation.execute("Phase Report Validation",() =>
                                        validator.validateCountReport(mapped.rows)
                                );
                                break;
                        }
                        // =====================================
                        // SUMMARY
                        // =====================================
                        validation.printSummary(
                            `${report.analysisType} Report API`,
                            responseTime
                        );
                    }
                );
            }
        );
    }
);