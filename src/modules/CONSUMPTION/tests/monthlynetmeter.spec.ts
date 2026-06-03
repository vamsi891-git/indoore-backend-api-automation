import { test } from "../../../../src/fixtures/api.fixture";
import { MonthlyNetMeterApi } from "../Api/monthlynetmeter.api";
import { monthlyNetMeterData } from "../Data/monthlynetmeter.data";
import { MonthlyNetMeterMapper } from "../Mapper/monthlynetmeter.mapper";
import { MonthlyNetMeterValidator } from "../Validator/monthlynetmeter.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
test.describe("Monthly Net Meter Consumption API",() => {
        test("Validate Monthly Net Meter Consumption API",
            {
                tag: [
                    "@consumption",
                    "@monthly-net-meter",
                    "@smoke"
                ]
            },
            async ({ authenticatedApi }) => {
                const api =new MonthlyNetMeterApi(authenticatedApi);
                const {
                    rawResponse,
                    responseBody,
                    responseTime
                } =await api.getMonthlyNetMeter(monthlyNetMeterData.page,monthlyNetMeterData.limit,monthlyNetMeterData.month,monthlyNetMeterData.year);
                await PerformanceTracker.track(
                    rawResponse,
                    "Monthly Net Meter Consumption API",
                    `${process.env.BASE_URL}/indore/consumption/monthly-net-meter?page=${monthlyNetMeterData.page}&limit=${monthlyNetMeterData.limit}&month=${monthlyNetMeterData.month}&year=${monthlyNetMeterData.year}`,
                    responseTime
                );
                const assert =new AssertionEngine();
                const validation =new ValidationEngine();
                validation.execute("Status Code",() =>
                        assert.validateStatusCode(rawResponse,200)
                );
                validation.execute("Content Type",() =>
                        assert.validateContentType(rawResponse)
                );
                validation.execute("Response Time",() =>
                        assert.validateResponseTime(responseTime,monthlyNetMeterData.maxResponseTime)
                );
                validation.execute("Sensitive Data",() =>
                        assert.validateSensitiveData(responseBody)
                );
                const mapped =MonthlyNetMeterMapper.map(responseBody);
                const validator =new MonthlyNetMeterValidator();
                validation.execute("Items Validation",() =>
                        validator.validateItems(mapped)
                );
                validation.execute("Pagination Validation",() =>
                        validator.validatePagination(mapped)
                );
                validation.execute("Required Fields",() =>
                        validator.validateRequiredFields(mapped.items)
                );
                validation.execute("Type Validation",() =>
                        validator.validateTypes(mapped.items)
                );
                validation.execute("Net KWH Logic",() =>
                        validator.validateNetKwhLogic(mapped.items)
                );
                validation.execute("Net KVAH Logic",() =>
                        validator.validateNetKvahLogic(mapped.items)
                );
                validation.execute("Null Handling",() =>
                        validator.validateNullHandling(mapped.items)
                );
                validation.execute("NaN Validation",() =>
                    validator.validateNoNaN(mapped.items)
                );
                validation.printSummary("Monthly Net Meter Consumption API",responseTime
                );
            }
        );
    }
);