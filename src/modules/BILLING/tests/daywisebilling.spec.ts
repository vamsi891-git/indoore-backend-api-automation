import { test } from "../../../../src/fixtures/api.fixture";
import { DaywiseBillingApi } from "../Api/daywisebilling.api";
import { DaywiseBillingTestData } from "../Data/daywisebilling.data";
import { DaywiseBillingMapper } from "../Mapper/daywisebilling.mapper";
import { DaywiseBillingValidator } from "../Validator/daywisebilling.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../../src/core/utils/performancetracker";
test.describe("Daywise Billing Data API", () => {
        test("Validate Daywise Billing Data API",
            {
                tag: [
                    "@smoke",
                    "@billing"
                ]
            },
            async ({ authenticatedApi }) => {
                const api =new DaywiseBillingApi(authenticatedApi);
                const {
                    rawResponse,
                    responseBody,
                    responseTime
                } = await api.getDaywiseBillingData(
                        DaywiseBillingTestData.month,
                        DaywiseBillingTestData.year,
                        DaywiseBillingTestData.includeTotal,
                        DaywiseBillingTestData.page,
                        DaywiseBillingTestData.limit
                    );
                await PerformanceTracker.track(
                    rawResponse,
                    "Daywise Billing Data API",
                    `${process.env.BASE_URL}/indore/billing/daywise-billing-data?month=${DaywiseBillingTestData.month}&year=${DaywiseBillingTestData.year}&includeTotal=${DaywiseBillingTestData.includeTotal}&page=${DaywiseBillingTestData.page}&limit=${DaywiseBillingTestData.limit}`,
                    responseTime
                );
                const assert = new AssertionEngine();
                const validation =  new ValidationEngine();
                validation.execute("Status Code",() =>
                        assert.validateStatusCode(rawResponse,200)
                );
                validation.execute("Content Type",() =>
                        assert.validateContentType(rawResponse)
                );
                validation.execute("Response Time",() =>
                        assert.validateResponseTime(responseTime,60000)
                );
                validation.execute("Sensitive Data",() =>
                        assert.validateSensitiveData(responseBody)
                );
                const data =DaywiseBillingMapper.mapData(responseBody.data);
                const validator =new DaywiseBillingValidator();
                validation.execute("Data Exists",() =>
                        validator.validateDataExists(data)
                );
                validation.execute("Pagination Validation",() =>
                        validator.validatePagination(data)
                );
                validation.execute("Month Year Validation",() =>
                        validator.validateMonthYear(data,DaywiseBillingTestData.month,DaywiseBillingTestData.year)
                );
                validation.execute("Has More Validation",() =>
                        validator.validateHasMoreFlag(data)
                );
                validation.execute("Meter Validation",() =>
                        validator.validateMeterDetails(data)
                );
                validation.execute("Consumer Validation",() =>
                        validator.validateConsumerData(data)
                );
                validation.execute("Daily KWH Validation",() =>
                        validator.validateDailyKwhValues(data)
                );
                validation.execute("Daily Reading Trend Validation",() =>
                        validator.validateDailyReadingTrend(data)
                );
                validation.execute("Duplicate Meter Validation",() =>
                        validator.validateDuplicateMeters(data)
                );
                validation.execute("Duplicate SL Number Validation",() =>
                        validator.validateDuplicateSlNos( data)
                );
                validation.execute("Null Safe Field Validation",() =>
                        validator.validateNullSafeFields(data)
                );
                validation.execute("No Data Validation",() =>
                        validator.validateNoDataScenario(data)
                );
                validation.printSummary("Daywise Billing Data API",responseTime);
            }
        );
    }
);