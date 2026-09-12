import { test } from "../../../fixtures/api.fixture";
import { test as authTest } from "../../../fixtures/auth.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { BackendResponse } from "../../../core/utils/backend-response.util";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { DtrConsumptionDetailsApi } from "../Api/dtrconsumptiondetails.api";
import {
    dtrConsumptionDetailsMaxResponseTimeMs,
    dtrConsumptionDetailsTestCases,
    resolveDtrConsumptionDetailsContractBody,
    resolveDtrConsumptionDetailsQuery,
} from "../Data/dtrconsumptiondetails.data";
import {
    dtrUnbalanceAccessTokenInvalidCode,
    dtrUnbalanceAuthNegativeCases,
    dtrUnbalanceUnauthorizedCode,
} from "../Data/dtr-unbalance-auth.data";
import {
    DtrConsumptionDetailsMapper,
    type DtrConsumptionDetailsErrorResponse,
} from "../Mapper/dtrconsumptiondetails.mapper";
import { DtrConsumptionDetailsValidator } from "../Validator/dtrconsumptiondetails.validator";

const CONSUMPTION_DETAILS_PATH =
    "/indore/dashboard/dtr/consumption-details";

test.describe("Dashboard — DTR consumption list", () => {
    test.describe.configure({ retries: 1 });
    test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

    for (const testCase of dtrConsumptionDetailsTestCases) {
        test(
            testCase.testName,
            { tag: testCase.tags },
            async ({ authenticatedApi }) => {
                const expectedStatus = testCase.expectedStatus ?? 200;
                const validator = new DtrConsumptionDetailsValidator();
                const assert = new AssertionEngine();
                const validation = new ValidationEngine();

                if (testCase.isContractFixture) {
                    const fixtureBody =
                        resolveDtrConsumptionDetailsContractBody(
                            testCase.scenario,
                        );
                    if (!fixtureBody) {
                        test.skip(
                            true,
                            "Missing DTR consumption-details contract body",
                        );
                        return;
                    }

                    const mapped =
                        DtrConsumptionDetailsMapper.map(fixtureBody);
                    validation.execute("Required Fields", () =>
                        assert.validateRequiredFields(fixtureBody, [
                            "success",
                            "data",
                        ]),
                    );
                    validation.execute("Contract Scenario", () =>
                        validator.validateScenario(mapped, testCase.scenario),
                    );
                    validation.printSummary(testCase.testName, 0);
                    return;
                }

                const api = new DtrConsumptionDetailsApi(authenticatedApi);
                const query = resolveDtrConsumptionDetailsQuery(
                    testCase.scenario,
                );

                const { rawResponse, responseBody, responseTime } =
                    await api.getDtrConsumptionDetails(query);

                await PerformanceTracker.track(
                    rawResponse,
                    testCase.testName,
                    rawResponse.url(),
                    responseTime,
                );

                validation.execute("Status Validation", () =>
                    assert.validateStatusCode(
                        rawResponse,
                        expectedStatus,
                        responseBody,
                    ),
                );
                validation.execute("Content Type", () =>
                    assert.validateContentType(rawResponse),
                );
                validation.execute("Response Time", () =>
                    assert.validateResponseTime(
                        responseTime,
                        dtrConsumptionDetailsMaxResponseTimeMs,
                    ),
                );
                validation.execute("Sensitive Data", () =>
                    assert.validateSensitiveData(responseBody),
                );
                validation.execute("Required Fields", () =>
                    assert.validateRequiredFields(responseBody, [
                        "success",
                        "data",
                    ]),
                );

                const mapped =
                    DtrConsumptionDetailsMapper.map(responseBody);
                validation.execute("Response Envelope", () =>
                    validator.validateResponseEnvelope(responseBody),
                );
                validation.execute("DTR Consumption Details Scenario", () =>
                    validator.validateScenario(
                        mapped,
                        testCase.scenario,
                        query,
                    ),
                );

                validation.printSummary(testCase.testName, responseTime);
            },
        );
    }
});

authTest.describe("DTR consumption list — cannot open without a valid login", () => {
    authTest.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

    for (const authCase of dtrUnbalanceAuthNegativeCases) {
        authTest(
            `${authCase.testName}`,
            {
                tag: [...authCase.tags, "@dtr-consumption-details"],
            },
            async ({ unauthenticatedApi }) => {
                const validator = new DtrConsumptionDetailsValidator();
                const assert = new AssertionEngine();
                const validation = new ValidationEngine();
                const started = Date.now();

                const rawResponse = await unauthenticatedApi.get(
                    CONSUMPTION_DETAILS_PATH,
                    {
                        headers: authCase.headers,
                        params: {
                            kind: "kwh",
                            page: 1,
                            limit: 10,
                        },
                    },
                );
                if (
                    BackendResponse.shouldSkipRateLimit(
                        rawResponse.status(),
                        `DTR consumption-details ${authCase.testName}`,
                    )
                ) {
                    authTest.skip(
                        true,
                        `Rate limited (429) on ${CONSUMPTION_DETAILS_PATH} — retry later`,
                    );
                    return;
                }
                const responseBody = await rawResponse.json().catch(() => ({}));
                const responseTime = Date.now() - started;

                await PerformanceTracker.track(
                    rawResponse,
                    `DTR consumption-details ${authCase.expectedErrorCode}`,
                    rawResponse.url(),
                    responseTime,
                );

                validation.execute("Status (auth negative)", () =>
                    assert.validateStatusCode(
                        rawResponse,
                        authCase.expectedStatus,
                        responseBody,
                    ),
                );
                validation.execute("Content Type", () =>
                    assert.validateContentType(rawResponse),
                );
                validation.execute("Auth Error Envelope", () => {
                    if (
                        authCase.expectedErrorCode ===
                        dtrUnbalanceAccessTokenInvalidCode
                    ) {
                        validator.validateAccessTokenInvalidError(
                            responseBody as DtrConsumptionDetailsErrorResponse,
                        );
                    } else if (
                        authCase.expectedErrorCode ===
                        dtrUnbalanceUnauthorizedCode
                    ) {
                        validator.validateUnauthorizedError(
                            responseBody as DtrConsumptionDetailsErrorResponse,
                        );
                    } else {
                        validator.validateAuthError(
                            responseBody as DtrConsumptionDetailsErrorResponse,
                            authCase.expectedErrorCode,
                            authCase.expectedMessage,
                        );
                    }
                });

                validation.printSummary(
                    `DTR Consumption Details — ${authCase.expectedErrorCode}`,
                    responseTime,
                );
            },
        );
    }
});
