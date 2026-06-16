import { expect } from "@playwright/test";
import { test } from "../../../../src/fixtures/api.fixture";
import { BillingDataApi } from "../Api/billingdata.api";
import { BillingDataTestData } from "../Data/billingdata.data";
import { BillingDataMapper } from "../Mapper/billingdata.mapper";
import { BillingDataValidator } from "../Validator/billingdata.validator";
import { BillingDataResponseSchema } from "../schemas/billing.schemas";
import type { ParsedBillingDataResponse } from "../schemas/billing.schemas";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../../src/core/utils/performancetracker";
import {
    BILLING_MAX_RESPONSE_TIME_MS,
    BILLING_TEST_TIMEOUT_MS,
} from "../../../core/constants/api-timeouts";

test.describe("Billing Data API", () => {
    test.setTimeout(BILLING_TEST_TIMEOUT_MS);

    test(
        "Validate Billing Data API",
        {
            tag: ["@smoke", "@billing"],
        },
        async ({ authenticatedApi }) => {
            const api = new BillingDataApi(authenticatedApi);
            const {
                rawResponse,
                responseBody,
                responseTime,
            } = await api.getBillingData(
                BillingDataTestData.month,
                BillingDataTestData.year,
                BillingDataTestData.page,
                BillingDataTestData.limit,
            );

            await PerformanceTracker.track(
                rawResponse,
                "Billing Data API",
                `${process.env.BASE_URL}/indore/billing/billing-data?month=${BillingDataTestData.month}&year=${BillingDataTestData.year}&page=${BillingDataTestData.page}&limit=${BillingDataTestData.limit}`,
                responseTime,
            );

            const assert = new AssertionEngine();
            const validation = new ValidationEngine();
            const validator = new BillingDataValidator();
            let parsed!: ParsedBillingDataResponse;

            try {
                validation.execute("Status Code", () =>
                    assert.validateStatusCode(rawResponse, 200),
                );
                validation.execute("Content Type", () =>
                    assert.validateContentType(rawResponse),
                );
                validation.execute("Response Time", () =>
                    assert.validateResponseTime(
                        responseTime,
                        BILLING_MAX_RESPONSE_TIME_MS,
                    ),
                );
                validation.execute("Sensitive Data", () =>
                    assert.validateSensitiveData(responseBody),
                );

                validation.execute("Zod Response Schema", () => {
                    const result =
                        BillingDataResponseSchema.safeParse(responseBody);
                    expect(
                        result.success,
                        result.success
                            ? "Zod validation passed"
                            : `Zod contract mismatch:\n${JSON.stringify(result.error.format(), null, 2)}`,
                    ).toBe(true);
                    parsed = result.data!;
                });

                const data = BillingDataMapper.mapData(parsed.data, {
                    month: BillingDataTestData.month,
                    year: BillingDataTestData.year,
                    page: BillingDataTestData.page,
                    limit: BillingDataTestData.limit,
                });

                validation.execute("Billing Data Exists", () =>
                    validator.validateBillingDataExists(data),
                );
                validation.execute("Pagination Validation", () =>
                    validator.validatePagination(data),
                );
                validation.execute("Billing Items Validation", () =>
                    validator.validateBillingItems(data),
                );
                validation.execute("Power Factor Validation", () =>
                    validator.validatePowerFactor(data),
                );
                validation.execute("Energy Calculation Validation", () =>
                    validator.validateEnergyCalculation(data),
                );
                validation.execute("KVAH Calculation Validation", () =>
                    validator.validateKvahCalculation(data),
                );
                validation.execute("Electrical Business Rules", () =>
                    validator.validateElectricalBusinessRules(data),
                );
                validation.execute("Export Energy Validation", () =>
                    validator.validateExportEnergy(data),
                );
                validation.execute("Billing Month Year Validation", () =>
                    validator.validateBillingMonthYear(
                        data,
                        BillingDataTestData.month,
                        BillingDataTestData.year,
                    ),
                );
                validation.execute("Duplicate SL Number Validation", () =>
                    validator.validateDuplicateSlNos(data),
                );
                validation.execute("Duplicate Billing Records Validation", () =>
                    validator.validateDuplicateBillingRecords(data),
                );
                validation.execute("NaN Validation", () =>
                    validator.validateNaNValues(data),
                );
                validation.execute("No Data Scenario Validation", () =>
                    validator.validateNoDataScenario(data),
                );
            } finally {
                validation.finalize("Billing Data API", responseTime);
            }
        },
    );
});
