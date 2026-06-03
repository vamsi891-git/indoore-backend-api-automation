import { test } from "../../../../src/fixtures/api.fixture";
import { EventLogCardsApi } from "../Api/eventlogcards.api";
import { eventLogCardsData } from "../Data/eventlogcards.data";
import { EventLogCardsMapper } from "../Mapper/eventlogcards.mapper";
import { EventLogCardsValidator } from "../Validator/eventlogcards.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker} from "../../../../src/core/utils/performancetracker";
test.describe("Event Log Cards API",() => {
        test("Validate Event Log Cards API",
            {
                tag: [
                    "@consumer",
                    "@event-log",
                    "@smoke"
                ]
            },
            async ({authenticatedApi}) => {
                const api =new EventLogCardsApi(authenticatedApi);
                const {
                    rawResponse,
                    responseBody,
                    responseTime
                } =await api.getEventLogCards(eventLogCardsData.consumerNumber);
                await PerformanceTracker.track(
                    rawResponse,
                    "Event Log Cards API",
                    `${process.env.BASE_URL}/indore/consumers/${eventLogCardsData.consumerNumber}/event-log/cards`,
                    responseTime
                );
                const assert = new AssertionEngine();
                const validation = new ValidationEngine();
                // =====================================
                // BASE API VALIDATIONS
                // =====================================
                validation.execute("Status Validation",() =>
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
                validation.execute("Required Fields",() =>
                        assert.validateRequiredFields(responseBody.data,["resolvedEvents","pendingEvents","avgResolutionTime"])
                );
                // =====================================
                // MAPPER
                // =====================================
                const data =EventLogCardsMapper.map(responseBody);
                const validator = new EventLogCardsValidator();
                // ====================================
                // BACKEND VALIDATIONS
                // =====================================
                validation.execute("Resolved Events",() =>
                        validator.validateResolvedEvents(data)
                );
                validation.execute("Pending Events",() =>
                        validator.validatePendingEvents(data)
                );
                validation.execute("Average Resolution Time",() =>
                        validator.validateAvgResolutionTime(data)
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
                // =====================================
                // SUMMARY
                // =====================================
                validation.printSummary("Event Log Cards API",responseTime);
            }
        );
    }
);