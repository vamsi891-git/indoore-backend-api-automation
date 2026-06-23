import { expect } from "@playwright/test";
import { test } from "../../../../src/fixtures/api.fixture";
import { DaywiseBillingApi } from "../Api/daywisebilling.api";
import { DaywiseBillingTestData } from "../Data/daywisebilling.data";
import { DaywiseBillingMapper } from "../Mapper/daywisebilling.mapper";
import { DaywiseBillingValidator } from "../Validator/daywisebilling.validator";
import { DaywiseBillingResponseSchema } from "../schemas/billing.schemas";
import type { ParsedDaywiseBillingResponse } from "../schemas/billing.schemas";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../../src/core/utils/performancetracker";
import {
    createPgPool,
    isDbConfigured,
} from "../../../core/db/postgres.client";
import {
    assertBillingMeterHeaderMatchesDb,
    firstBillingRowWithMeter,
} from "./billing-db.helpers";
import {
    BILLING_MAX_RESPONSE_TIME_MS,
    BILLING_TEST_TIMEOUT_MS,
} from "../../../core/constants/api-timeouts";

test.describe("Daywise Billing Data API", () => {
    test.describe.configure({ retries: 2 });
    test.setTimeout(BILLING_TEST_TIMEOUT_MS);

    test(
        "Validate Daywise Billing Data API",
        {
            tag: ["@smoke", "@billing"],
        },
        async ({ authenticatedApi }) => {
            const api = new DaywiseBillingApi(authenticatedApi);
            const {
                rawResponse,
                responseBody,
                responseTime,
            } = await api.getDaywiseBillingData(
                DaywiseBillingTestData.month,
                DaywiseBillingTestData.year,
                DaywiseBillingTestData.includeTotal,
                DaywiseBillingTestData.page,
                DaywiseBillingTestData.limit,
            );

            await PerformanceTracker.track(
                rawResponse,
                "Daywise Billing Data API",
                `${process.env.BASE_URL}/indore/billing/daywise-billing-data?month=${DaywiseBillingTestData.month}&year=${DaywiseBillingTestData.year}&includeTotal=${DaywiseBillingTestData.includeTotal}&page=${DaywiseBillingTestData.page}&limit=${DaywiseBillingTestData.limit}`,
                responseTime,
            );

            const assert = new AssertionEngine();
            const validation = new ValidationEngine();
            const validator = new DaywiseBillingValidator();
            let parsed!: ParsedDaywiseBillingResponse;
            let mappedData:
                | ReturnType<typeof DaywiseBillingMapper.mapData>
                | undefined;

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
                        DaywiseBillingResponseSchema.safeParse(responseBody);
                    expect(
                        result.success,
                        result.success
                            ? "Zod validation passed"
                            : `Zod contract mismatch:\n${JSON.stringify(result.error.format(), null, 2)}`,
                    ).toBe(true);
                    parsed = result.data!;
                });

                const data = DaywiseBillingMapper.mapData(parsed.data, {
                    month: DaywiseBillingTestData.month,
                    year: DaywiseBillingTestData.year,
                    page: DaywiseBillingTestData.page,
                    limit: DaywiseBillingTestData.limit,
                });
                mappedData = data;
                validation.execute("Data Exists", () =>
                    validator.validateDataExists(data),
                );
                validation.execute("Pagination Validation", () =>
                    validator.validatePagination(data),
                );
                validation.execute("Month Year Validation", () =>
                    validator.validateMonthYear(
                        data,
                        DaywiseBillingTestData.month,
                        DaywiseBillingTestData.year,
                    ),
                );
                validation.execute("Has More Validation", () =>
                    validator.validateHasMoreFlag(data),
                );
                validation.execute("Meter Validation", () =>
                    validator.validateMeterDetails(data),
                );
                validation.execute("Consumer Validation", () =>
                    validator.validateConsumerData(data),
                );
                validation.execute("Daily KWH Validation", () =>
                    validator.validateDailyKwhValues(data),
                );
                validation.execute("Daily Reading Trend Validation", () =>
                    validator.validateDailyReadingTrend(data),
                );
                validation.execute("Duplicate Meter Validation", () =>
                    validator.validateDuplicateMeters(data),
                );
                validation.execute("Duplicate SL Number Validation", () =>
                    validator.validateDuplicateSlNos(data),
                );
                validation.execute("Null Safe Field Validation", () =>
                    validator.validateNullSafeFields(data),
                );
                validation.execute("No Data Validation", () =>
                    validator.validateNoDataScenario(data),
                );
            } finally {
                validation.finalize("Daywise Billing Data API", responseTime);
            }

            if (isDbConfigured() && mappedData) {
                const apiRow = firstBillingRowWithMeter(mappedData.items);
                if (apiRow?.meterNumber?.trim()) {
                    const pool = createPgPool();
                    try {
                        await assertBillingMeterHeaderMatchesDb(pool, apiRow);
                    } finally {
                        await pool.end();
                    }
                }
            }
        },
    );
});
