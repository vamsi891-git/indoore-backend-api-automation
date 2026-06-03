import { test } from "../../../../src/fixtures/api.fixture";
import {  DtrDailyThresholdChartApi} from "../Api/dtrdailythresholdchart.api";
import { dtrDailyThresholdChartData} from "../Data/dtrdailythresholdchart.data";
import {  DtrDailyThresholdChartMapper} from "../Mapper/dtrdailythresholdchart.mapper";
import {   DtrDailyThresholdChartValidator} from "../Validator/dtrdailythresholdchart.validator";
import { AssertionEngine} from "../../../core/engine/assertion.engine";
import { ValidationEngine} from "../../../core/engine/validation.engine";
import {  PerformanceTracker} from "../../../core/utils/performancetracker";
test.describe("DTR Daily Threshold Chart API",() => {

        test(
            "Validate DTR Daily Threshold Chart API",
            {
                tag: [
                    "@dtr",
                    "@daily-threshold-chart",
                    "@smoke"
                ]
            },
            async ({authenticatedApi}) => {
                const api =new DtrDailyThresholdChartApi(authenticatedApi);
                const {
                    rawResponse,
                    responseBody,
                    responseTime
                } =await api.getDailyThresholdChart(dtrDailyThresholdChartData.dtrCode);
                await PerformanceTracker.track(
                    rawResponse,
                    "DTR Daily Threshold Chart API",
                    `${process.env.BASE_URL}/indore/dtr/${dtrDailyThresholdChartData.dtrCode}/daily-threshold-chart`,
                    responseTime
                );
                const assert = new AssertionEngine();
                const validation =  new ValidationEngine();
                // =====================================
                // API VALIDATIONS
                // =====================================
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
                // =====================================
                // MAPPER
                // =====================================
                const mapped =DtrDailyThresholdChartMapper.map(responseBody);
                const validator =new DtrDailyThresholdChartValidator();
                // =====================================
                // BACKEND VALIDATIONS
                // =====================================
                validation.execute("Success Validation",() =>
                        validator.validateSuccess(responseBody)
                );
                validation.execute("Field Validation",() =>
                        validator.validateFields(mapped)
                );
                validation.execute("Year Validation",() =>
                        validator.validateYear(mapped.year)
                );
                validation.execute("Points Length Validation",() =>
                        validator.validatePointsLength(mapped.points)
                );
                validation.execute("Month Structure Validation",() =>
                        validator.validateMonthStructure(mapped.points,dtrDailyThresholdChartData.expectedMonths)
                );
                validation.execute("Point Structure Validation",() =>
                        validator.validatePointStructure(mapped.points)
                );
                validation.execute("Month Range Validation",() =>
                        validator.validateMonthRange(mapped.points)
                );
                validation.execute("Numeric Or Null Validation",() =>
                        validator.validateNumericOrNull(mapped.points)
                );
                validation.execute("Power Factor Range Validation",() =>
                        validator.validatePowerFactorRange(mapped.points)
                );
                validation.execute("Non Negative Values Validation",() =>
                        validator.validateNonNegativeValues(mapped.points)
                );
                validation.execute("Month Labels Validation",() =>
                        validator.validateMonthLabelsNotEmpty(mapped.points)
                );
                validation.execute("Unique Months Validation",() =>
                        validator.validateUniqueMonths(mapped.points)
                );
                validation.execute("Month Order Validation",() =>
                        validator.validateMonthOrder(mapped.points)
                );
                validation.execute("Point Types Validation",() =>
                        validator.validatePointTypes(mapped.points)
                );
                // =====================================
                // SUMMARY
                //=====================================
                validation.printSummary("DTR Daily Threshold Chart API",responseTime );
            }
        );
    }
);