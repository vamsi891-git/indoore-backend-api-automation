import { test } from "../../../../src/fixtures/api.fixture";
import { BillingHistoryApi } from "../Api/billinghistory.api";
import { billingHistoryData } from "../Data/billinghistory.data";
import { BillingHistoryMapper } from "../Mapper/billinghistory.mapper";
import { BillingHistoryValidator } from "../Validator/billinghistory.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../../src/core/utils/performancetracker";

test.describe("Billing History API", () => {
    test(
        "Validate Billing History API",
        {
            tag: ["@consumer", "@billing", "@billing-history", "@smoke"],
        },
        async ({ authenticatedApi }) => {
            const api = new BillingHistoryApi(authenticatedApi);
            const { consumerNumber, maxResponseTime } = billingHistoryData;

            const { rawResponse, responseBody, responseTime } =
                await api.getBillingHistory(consumerNumber);

            await PerformanceTracker.track(
                rawResponse,
                "Billing History API",
                `${process.env.BASE_URL}/indore/consumers/${consumerNumber}/billing-history`,
                responseTime,
            );

            const assert = new AssertionEngine();
            const validation = new ValidationEngine();
            const validator = new BillingHistoryValidator();

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
                assert.validateRequiredFields(responseBody, ["success", "data"]),
            );

            const mapped = BillingHistoryMapper.map(responseBody);
            const { items } = mapped;

            validation.execute("Success", () =>
                validator.validateSuccess(mapped.success),
            );
            validation.execute("Root Structure", () =>
                validator.validateRootStructure(items),
            );
            validation.execute("Empty Scenario", () =>
                validator.validateEmptyScenario(items),
            );
            validation.execute("Items Present When Non Empty", () =>
                validator.validateItemsPresentWhenNonEmpty(items),
            );

            validation.execute("Data Present Contract", () =>
                validator.validateDataPresentContract(items),
            );
            validation.execute("Row Required Fields", () =>
                validator.validateRowRequiredFields(items),
            );
            validation.execute("Row Structure", () =>
                validator.validateRowStructure(items),
            );
            validation.execute("Period Label", () =>
                validator.validatePeriodLabel(items),
            );
            validation.execute("Consumption Kwh", () =>
                validator.validateConsumptionKwh(items),
            );
            validation.execute("Bill Amount Stub", () =>
                validator.validateBillAmountStub(items),
            );
            validation.execute("Payment Status Stub", () =>
                validator.validatePaymentStatusStub(items),
            );
            validation.execute("Consumption Summary Text", () =>
                validator.validateConsumptionSummaryText(items),
            );
            validation.execute("Summary Exact Backend Format", () =>
                validator.validateSummaryExactBackendFormat(items),
            );
            validation.execute("Summary Matches Consumption", () =>
                validator.validateSummaryMatchesConsumption(items),
            );
            validation.execute("Oldest Billing Period Rule", () =>
                validator.validateOldestBillingPeriodRule(items),
            );
            validation.execute("Unique Period Labels", () =>
                validator.validateUniquePeriodLabels(items),
            );
            validation.execute("Descending Period Order", () =>
                validator.validateDescendingPeriodOrder(items),
            );
            validation.execute("NaN Values", () =>
                validator.validateNaNValues(items),
            );
            validation.execute("Business Rules", () =>
                validator.validateBusinessRules(items),
            );
            validation.execute("Data Present Backend Rules", () =>
                validator.validateDataPresentBackendRules(items),
            );

            validation.printSummary("Billing History API", responseTime);
        },
    );
});
