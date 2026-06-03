import { test } from "../../../../src/fixtures/api.fixture";
import { DtrStatisticsApi} from "../Api/dtrstatistics.api";
import { dtrStatisticsData} from "../Data/dtrstatistics.data";
import { DtrStatisticsMapper} from "../Mapper/dtrstatistics.mapper";
import { DtrStatisticsValidator} from "../Validator/dtrstatistics.validator";
import { AssertionEngine} from "../../../core/engine/assertion.engine";
import { ValidationEngine} from "../../../core/engine/validation.engine";
import {  PerformanceTracker} from "../../../core/utils/performancetracker";
test.describe("DTR Statistics API",() => {
        test("Validate DTR Statistics API",{
                tag: [
                    "@dtr",
                    "@statistics",
                    "@smoke"
                ]
            },
            async ({authenticatedApi}) => {
                const api =new DtrStatisticsApi(authenticatedApi);
                const {
                    rawResponse,
                    responseBody,
                    responseTime
                } =await api.getDtrStatistics(dtrStatisticsData.dtrCode);
                await PerformanceTracker.track(
                    rawResponse,
                    "DTR Statistics API",
                    `${process.env.BASE_URL}/indore/dtr/${dtrStatisticsData.dtrCode}/statistics`,
                    responseTime
                );
                const assert =new AssertionEngine();
                const validation =new ValidationEngine();
                // =====================================
                // BASE API VALIDATIONS
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
                validation.execute("Required Fields",() =>
                        assert.validateRequiredFields(responseBody.data,["statisticCards"])
                );
                // =====================================
                // MAPPER
                // =====================================
                const mapped =DtrStatisticsMapper.map(responseBody);
                const validator =new DtrStatisticsValidator();
                // =====================================
                // BACKEND VALIDATIONS
                // =====================================
                validation.execute("Card Count",() =>
                        validator.validateCardCount(mapped.statisticCards)
                );
                validation.execute("Card Titles",() =>
                        validator.validateCardTitles(mapped.statisticCards)
                );
                validation.execute("Values Validation",() =>
                        validator.validateValues(mapped.statisticCards)
                );
                validation.execute("Trend Validation",() =>
                        validator.validateTrendPercent(mapped.statisticCards)
                );
                validation.execute("Power Format",() =>
                        validator.validatePowerFormat(mapped.statisticCards)
                );
                validation.execute("Status Card",() =>
                        validator.validateStatusCard(mapped.statisticCards)
                );
                validation.execute("Decimal Formats",() =>
                        validator.validateDecimalFormats(mapped.statisticCards)
                );
                validation.execute("Unbalanced Feeders",() =>
                        validator.validateUnbalancedFeeders(mapped.statisticCards
                        )
                );
                validation.execute("Subtitle Validation",() =>
                        validator.validateSubtitles(mapped.statisticCards)
                );
                validation.execute("Fallback Logic",() =>
                        validator.validateFallbackValues(mapped.statisticCards)
                );
                validation.execute("Business Rules",() =>
                        validator.validateBusinessRules(mapped.statisticCards)
                );
                // =====================================
                // SUMMARY
                // =====================================
                validation.printSummary("DTR Statistics API",responseTime);
            }
        );
    }
);