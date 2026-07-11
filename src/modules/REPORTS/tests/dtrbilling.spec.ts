import { test } from "../../../../src/fixtures/api.fixture";
import { AssertionEngine } from "../../../../src/core/engine/assertion.engine";
import { ValidationEngine } from "../../../../src/core/engine/validation.engine";
import { PerformanceTracker } from "../../../../src/core/utils/performancetracker";
import { DtrBillingApi } from "../Api/dtrbilling.api";
import { DtrBillingData } from "../Data/dtrbilling.data";
import { DtrBillingMapper } from "../Mapper/dtrbilling.mapper";
import { DtrBillingValidator } from "../Validator/dtrbilling.validator";

test.describe("DTR Billing Report API", () => {
    test(
        "Validate DTR Billing Report API",
        {
            tag: ["@smoke", "@reports", "@dtr-billing"],
        },
        async ({ authenticatedApi }) => {
            const api = new DtrBillingApi(authenticatedApi);
            const assert = new AssertionEngine();
            const validation = new ValidationEngine();
            const validator = new DtrBillingValidator();

            const { fromDate, toDate, page, limit, includeTotal } =
                DtrBillingData;

            const { rawResponse, responseBody, responseTime } =
                await api.getDtrBilling(
                    fromDate,
                    toDate,
                    page,
                    limit,
                    includeTotal,
                );

            await PerformanceTracker.track(
                rawResponse,
                "DTR Billing Report API",
                `${process.env.BASE_URL}/indore/reports/dtr-billing?fromDate=${fromDate}&toDate=${toDate}&page=${page}&limit=${limit}&includeTotal=${includeTotal}`,
                responseTime,
            );

            validation.execute("Status Code", () =>
                assert.validateStatusCode(rawResponse, 200),
            );
            validation.execute("Content Type", () =>
                assert.validateContentType(rawResponse),
            );
            validation.execute("Response Time", () =>
                assert.validateResponseTime(
                    responseTime,
                    DtrBillingData.maxResponseTime,
                ),
            );
            validation.execute("Sensitive Data", () =>
                assert.validateSensitiveData(responseBody),
            );

            const mapped = DtrBillingMapper.map(responseBody);
            const data = mapped.data;
            const rows = data.rows;

            validation.execute("Success", () =>
                validator.validateSuccess(mapped),
            );
            validation.execute("Root Structure", () =>
                validator.validateRootStructure(mapped),
            );
            validation.execute("Query Echo", () =>
                validator.validateQueryEcho(
                    data,
                    fromDate,
                    toDate,
                    page,
                    limit,
                ),
            );
            validation.execute("Date Range Format", () =>
                validator.validateDateRangeFormat(data),
            );
            validation.execute("Pagination", () =>
                validator.validatePagination(data),
            );
            validation.execute("Include Total Flag", () =>
                validator.validateIncludeTotalFlag(data, includeTotal),
            );
            validation.execute("Scope Metadata", () =>
                validator.validateScopeMetadata(data),
            );
            validation.execute("Applied Filters", () =>
                validator.validateAppliedFilters(data),
            );
            validation.execute("No Data Scenario", () =>
                validator.validateNoDataScenario(data),
            );
            validation.execute("Rows Present When Total Positive", () =>
                validator.validateRowsPresentWhenTotalPositive(data),
            );

            if (rows.length > 0) {
                validation.execute("Rows Structure", () =>
                    validator.validateRowsStructure(rows),
                );
                validation.execute("Hierarchy Fields", () =>
                    validator.validateHierarchyFields(rows),
                );
                validation.execute("Meter Serial Number", () =>
                    validator.validateMeterSerialNumber(rows),
                );
                validation.execute("Date Time Format", () =>
                    validator.validateDateTimeFormat(rows),
                );
                validation.execute("Billing Date In Range", () =>
                    validator.validateBillingDateInRange(
                        rows,
                        fromDate,
                        toDate,
                    ),
                );
                validation.execute("Energy Fields", () =>
                    validator.validateEnergyFields(rows),
                );
                validation.execute("Electrical Business Rules", () =>
                    validator.validateElectricalBusinessRules(rows),
                );
                validation.execute("Export Energy", () =>
                    validator.validateExportEnergy(rows),
                );
                validation.execute("MF", () => validator.validateMf(rows));
                validation.execute("SL No Sequence", () =>
                    validator.validateSlNoSequence(rows, page, limit),
                );
                validation.execute("Unique SL No", () =>
                    validator.validateUniqueSlNo(rows),
                );
                validation.execute("Unique Meter Serial", () =>
                    validator.validateUniqueMeterSerial(rows),
                );
            }
            validation.printSummary("DTR Billing Report API", responseTime);
        },
    );
});
