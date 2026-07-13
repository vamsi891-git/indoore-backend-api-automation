import { test } from "../../../../src/fixtures/api.fixture";
import { BillingPeriodApi } from "../Api/billingperiod.api";
import { billingPeriodData } from "../Data/billingperiod.data";
import { BillingPeriodMapper } from "../Mapper/billingperiod.mapper";
import { BillingPeriodValidator } from "../Validator/billingperiod.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../../src/core/utils/performancetracker";
test.describe("Billing Period API",() => {
        test("Validate Billing Period API",
            {
                tag: [
                    "@consumer",
                    "@billing",
                    "@smoke"
                ]
            },
            async ({authenticatedApi}) => {
                const api =new BillingPeriodApi(authenticatedApi);
                const {
                    rawResponse,
                    responseBody,
                    responseTime
                } = await api.getBillingPeriod(billingPeriodData.consumerNumber);
                await PerformanceTracker.track(
        rawResponse,
        "Billing Period API",
        rawResponse.url(),
        responseTime
      );
                const assert = new AssertionEngine();
                const validation = new ValidationEngine();
                /*
                =====================================
                BASE API VALIDATIONS
                =====================================
                */
                validation.execute("Status Validation",() => 
                    assert.validateStatusCode(rawResponse,200)
                );
                validation.execute("Content Type",() => 
                    assert.validateContentType(rawResponse)
                );
                validation.execute("Response Time",() => 
                    assert.validateResponseTime(responseTime,billingPeriodData.maxResponseTime)
                );
                validation.execute("Sensitive Data",() => 
                    assert.validateSensitiveData(responseBody)
                );
                validation.execute("Required Fields",() => 
                    assert.validateRequiredFields(responseBody.data,["monthlyConsumption","dailyConsumption","totalOutstanding","billStatus"])
                );
                /*
                =====================================
                MAPPER
                =====================================
                */
                const data = BillingPeriodMapper.map(responseBody);
                const validator = new BillingPeriodValidator();
                /*
                =====================================
                BACKEND VALIDATIONS
                =====================================
                */
                validation.execute("Monthly Consumption",() => 
                    validator.validateMonthlyConsumption(data)
                );
                validation.execute("Daily Consumption",() => 
                    validator.validateDailyConsumption(data)
                );
                validation.execute("Outstanding Validation",() => 
                    validator.validateOutstanding(data)
                );
                validation.execute("Bill Status",() => 
                    validator.validateBillStatus(data)
                );
                validation.execute("Fallback Logic",() => 
                    validator.validateFallbackLogic(data)
                );
                validation.execute("Trend Validation",() => 
                    validator.validateTrendPercent(data)
                );
                validation.execute("Business Rules",() => 
                    validator.validateBusinessRules(data)
                );
                /*
                =====================================
                SUMMARY
                =====================================
                */
                validation.printSummary("Billing Period API",responseTime);
            });
    });