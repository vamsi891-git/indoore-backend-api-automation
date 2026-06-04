import { test } from "../../../../src/fixtures/api.fixture";
import { AuditLogsApi } from "../Api/auditlogs.api";
import { AuditLogsTestData } from "../Data/auditlogs.data";
import { AuditLogsMapper } from "../Mapper/auditlogs.mapper";
import { AuditLogsValidator } from "../Validator/auditlogs.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../../src/core/utils/performancetracker";
test.describe("Audit Logs API",() => {
        test("Validate Audit Logs DESC API",
            {
                tag: [
                    "@smoke",
                    "@audit"
                ]
            },
            async ({ authenticatedApi }) => {
                const api =new AuditLogsApi(authenticatedApi);
                const {
                    rawResponse,
                    responseBody,
                    responseTime
                } = await api.getAuditLogs(AuditLogsTestData.page,AuditLogsTestData.limit,AuditLogsTestData.descSort);
                await PerformanceTracker.track(
                    rawResponse,
                    "Audit Logs DESC API",
                    `${process.env.BASE_URL}/indore/users/audit-logs?page=${AuditLogsTestData.page}&limit=${AuditLogsTestData.limit}&sort=${AuditLogsTestData.descSort}`,
                    responseTime
                );
                const assert = new AssertionEngine();
                const validation = new ValidationEngine();
                validation.execute( "Status",() =>
                     assert.validateStatusCode(rawResponse,200)
                );
                validation.execute("Content",() =>
                        assert.validateContentType(rawResponse)
                );
                validation.execute("Response Time",() =>
                        assert.validateResponseTime(responseTime,60000)
                );
                validation.execute("Security",() =>
                        assert.validateSensitiveData(responseBody)
                );
                const data =AuditLogsMapper.mapData(responseBody.data);
                const validator = new AuditLogsValidator();
                validation.execute("Audit Logs Exists",() =>
                        validator.validateAuditLogsExists(data)
                );
                validation.execute("Pagination",() =>
                        validator.validatePagination(data)
                );
                validation.execute("Audit Log Fields",() =>
                        validator.validateAuditLogFields(data)
                );
                validation.execute("UUID Validation",() =>
                        validator.validateUuidFields(data)
                );
                validation.execute("Email Validation",() =>
                        validator.validateEmails(data)
                );
                validation.execute("Role Validation",() =>
                        validator.validateRoles(data)
                );
                validation.execute("Full Name Validation",() =>
                        validator.validateFullNames(data)
                );
                validation.execute("Action Validation",() =>
                        validator.validateActions(data)
                );
                validation.execute("IP Validation",() =>
                        validator.validateIpAddresses(data)
                );
                validation.execute("Details Validation",() =>
                        validator.validateDetails(data)
                );
                validation.execute("Created At Validation",() =>
                        validator.validateCreatedAt(data)
                );
                validation.execute("Duplicate IDs Validation",() =>
                        validator.validateDuplicateIds(data)
                );
                validation.execute("Next Cursor Validation",() =>
                        validator.validateNextCursor(data)
                );
                validation.execute("Target Consistency",() =>
                        validator.validateTargetConsistency(data)
                );
                validation.execute("Descending Sort Validation",() =>
                        validator.validateDescendingSort(data)
                );
                validation.execute("No Data Validation",() =>
                        validator.validateNoDataScenario(data)
                );
                validation.printSummary(
                    "Audit Logs DESC API",
                    responseTime
                );

            }

        );

        test(
            "Validate Audit Logs ASC API",
            {
                tag: [
                    "@smoke",
                    "@audit"
                ]
            },
            async ({ authenticatedApi }) => {

                const api =
                    new AuditLogsApi(
                        authenticatedApi
                    );

                const {
                    rawResponse,
                    responseBody,
                    responseTime
                } =
                    await api.getAuditLogs(
                        AuditLogsTestData.page,
                        AuditLogsTestData.limit,
                        AuditLogsTestData.ascSort
                    );

                await PerformanceTracker.track(

                    rawResponse,

                    "Audit Logs ASC API",

                    `${process.env.BASE_URL}/indore/users/audit-logs?page=${AuditLogsTestData.page}&limit=${AuditLogsTestData.limit}&sort=${AuditLogsTestData.ascSort}`,

                    responseTime

                );

                const assert =
                    new AssertionEngine();

                const validation =
                    new ValidationEngine();

                validation.execute(
                    "Status",
                    () =>
                        assert.validateStatusCode(
                            rawResponse,
                            200
                        )
                );

                validation.execute(
                    "Content",
                    () =>
                        assert.validateContentType(
                            rawResponse
                        )
                );

                validation.execute(
                    "Response Time",
                    () =>
                        assert.validateResponseTime(
                            responseTime,
                            60000
                        )
                );

                validation.execute(
                    "Security",
                    () =>
                        assert.validateSensitiveData(
                            responseBody
                        )
                );

                const data =
                    AuditLogsMapper.mapData(
                        responseBody.data
                    );

                const validator =
                    new AuditLogsValidator();

                validation.execute(
                    "Pagination",
                    () =>
                        validator.validatePagination(
                            data
                        )
                );

                validation.execute(
                    "Ascending Sort Validation",
                    () =>
                        validator.validateAscendingSort(
                            data
                        )
                );

                validation.execute(
                    "Duplicate IDs Validation",
                    () =>
                        validator.validateDuplicateIds(
                            data
                        )
                );

                validation.execute(
                    "Created At Validation",
                    () =>
                        validator.validateCreatedAt(
                            data
                        )
                );

                validation.printSummary(
                    "Audit Logs ASC API",
                    responseTime
                );

            }

        );

    }
);