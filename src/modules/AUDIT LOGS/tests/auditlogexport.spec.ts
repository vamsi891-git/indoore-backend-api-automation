import { test } from "../../../../src/fixtures/api.fixture";

import { AuditLogExportApi } from "../Api/auditlogexport.api";

import { AuditLogExportTestData } from "../Data/auditlogexport.data";

import { AuditLogExportValidator } from "../Validator/auditlogexport.validator";

import { CsvParser } from "../Utils/csv.parser";

import { AssertionEngine } from "../../../core/engine/assertion.engine";

import { ValidationEngine } from "../../../core/engine/validation.engine";

import { PerformanceTracker } from "../../../../src/core/utils/performancetracker";

test.describe(
    "Audit Log Export API",
    () => {
        test.describe.configure({
            mode: "serial",
            retries: 0,
            timeout: 480_000,
        });

        test(
            "Validate Audit Log Export ASC API",
            {
                tag: [
                    "@smoke",
                    "@audit",
                    "@export"
                ],
            },

            async ({ authenticatedApi }) => {

                const api =
                    new AuditLogExportApi(
                        authenticatedApi
                    );

                const {

                    rawResponse,

                    csvContent,

                    responseTime

                } =
                    await api.exportAuditLogs(

                        AuditLogExportTestData.limit,

                        AuditLogExportTestData.ascSort

                    );

                await PerformanceTracker.track(

                    rawResponse,

                    "Audit Log Export ASC API",

                    `${process.env.BASE_URL}/indore/users/audit-logs/export?limit=${AuditLogExportTestData.limit}&sort=${AuditLogExportTestData.ascSort}`,

                    responseTime

                );

                const assert =
                    new AssertionEngine();

                const validation =
                    new ValidationEngine();

                validation.execute(
                    "Status Code",
                    () =>
                        assert.validateStatusCode(
                            rawResponse,
                            200,
                            csvContent.slice(0, 300),
                        )
                );

                validation.execute(
                    "Content Type",
                    () =>
                        assert.validateContentType(
                            rawResponse,
                            "text/csv"
                        )
                );

                validation.execute(
                    "Response Time",
                    () =>
                        assert.validateResponseTime(
                            responseTime,
                            AuditLogExportTestData.maxResponseTimeMs,
                        )
                );

                validation.execute(
                    "File Not Empty",
                    () =>
                        new AuditLogExportValidator()
                            .validateFileNotEmpty(
                                csvContent
                            )
                );

                validation.execute(
                    "Header Validation",
                    () =>
                        new AuditLogExportValidator()
                            .validateHeaders(
                                csvContent
                            )
                );

                const rows =
                    CsvParser.parseAuditLogCsv(
                        csvContent
                    );

                const validator =
                    new AuditLogExportValidator();

                validation.execute(
                    "Row Count Validation",
                    () =>
                        validator.validateRowCount(
                            rows,
                            AuditLogExportTestData.limit
                        )
                );

                validation.execute(
                    "Audit Rows Validation",
                    () =>
                        validator.validateAuditRows(
                            rows
                        )
                );

                validation.execute(
                    "UUID Validation",
                    () =>
                        validator.validateUUIDs(
                            rows
                        )
                );

                validation.execute(
                    "Email Validation",
                    () =>
                        validator.validateEmails(
                            rows
                        )
                );

                validation.execute(
                    "Role Validation",
                    () =>
                        validator.validateRoles(
                            rows
                        )
                );

                validation.execute(
                    "Full Name Validation",
                    () =>
                        validator.validateFullNames(
                            rows
                        )
                );

                validation.execute(
                    "Action Validation",
                    () =>
                        validator.validateActions(
                            rows
                        )
                );

                validation.execute(
                    "Created At Validation",
                    () =>
                        validator.validateCreatedAt(
                            rows
                        )
                );

                validation.execute(
                    "IP Address Validation",
                    () =>
                        validator.validateIpAddresses(
                            rows
                        )
                );

                validation.execute(
                    "Details Validation",
                    () =>
                        validator.validateDetails(
                            rows
                        )
                );

                validation.execute(
                    "Duplicate ID Validation",
                    () =>
                        validator.validateDuplicateIds(
                            rows
                        )
                );

                validation.execute(
                    "Target Consistency Validation",
                    () =>
                        validator.validateTargetConsistency(
                            rows
                        )
                );

                validation.execute(
                    "Ascending Sort Validation",
                    () =>
                        validator.validateAscendingSort(
                            rows
                        )
                );

                validation.execute(
                    "No Data Validation",
                    () =>
                        validator.validateNoDataScenario(
                            rows
                        )
                );

                validation.printSummary(
                    "Audit Log Export ASC API",
                    responseTime
                );

            }

        );

        test(
            "Validate Audit Log Export DESC API",
            {
                tag: [
                    "@smoke",
                    "@audit",
                    "@export"
                ],
            },

            async ({ authenticatedApi }) => {

                await new Promise((resolve) =>
                    setTimeout(
                        resolve,
                        AuditLogExportTestData.exportCooldownMs,
                    ),
                );

                const api =
                    new AuditLogExportApi(
                        authenticatedApi
                    );

                const {

                    rawResponse,

                    csvContent,

                    responseTime

                } =
                    await api.exportAuditLogs(

                        AuditLogExportTestData.limit,

                        AuditLogExportTestData.descSort

                    );

                await PerformanceTracker.track(

                    rawResponse,

                    "Audit Log Export DESC API",

                    `${process.env.BASE_URL}/indore/users/audit-logs/export?limit=${AuditLogExportTestData.limit}&sort=${AuditLogExportTestData.descSort}`,

                    responseTime

                );

                const assert =
                    new AssertionEngine();

                const validation =
                    new ValidationEngine();

                validation.execute(
                    "Status Code",
                    () =>
                        assert.validateStatusCode(
                            rawResponse,
                            200,
                            csvContent.slice(0, 300),
                        )
                );

                validation.execute(
                    "Content Type",
                    () =>
                        assert.validateContentType(
                            rawResponse,
                            "text/csv"
                        )
                );

                validation.execute(
                    "Response Time",
                    () =>
                        assert.validateResponseTime(
                            responseTime,
                            AuditLogExportTestData.maxResponseTimeMs,
                        )
                );

                const rows =
                    CsvParser.parseAuditLogCsv(
                        csvContent
                    );

                const validator =
                    new AuditLogExportValidator();

                validation.execute(
                    "Row Count Validation",
                    () =>
                        validator.validateRowCount(
                            rows,
                            AuditLogExportTestData.limit
                        )
                );

                validation.execute(
                    "Created At Validation",
                    () =>
                        validator.validateCreatedAt(
                            rows
                        )
                );

                validation.execute(
                    "Duplicate ID Validation",
                    () =>
                        validator.validateDuplicateIds(
                            rows
                        )
                );

                validation.execute(
                    "Descending Sort Validation",
                    () =>
                        validator.validateDescendingSort(
                            rows
                        )
                );

                validation.printSummary(
                    "Audit Log Export DESC API",
                    responseTime
                );

            }

        );

    }
);