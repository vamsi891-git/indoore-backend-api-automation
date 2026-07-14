import { test } from "../../../fixtures/api.fixture";
import { ConsumerSearchApi } from "../Api/consumer-search.api";
import { consumerSearchData } from "../Data/consumer-search.data";
import { ConsumerSearchMapper } from "../Mapper/consumer-search.mapper";
import { ConsumerSearchValidator } from "../Validator/consumer-search.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";

test.describe("Meter Replacement Consumer Search API", () => {
    test(
        "Validate Meter Replacement Consumer Search API",
        {
            tag: [
                "@meter-replacement",
                "@consumer-search",
                "@smoke",
            ],
        },
        async ({ authenticatedApi }) => {
            const api = new ConsumerSearchApi(authenticatedApi);

            const {
                validSearch,
                maxResponseTime,
            } = consumerSearchData;

            const {
                rawResponse,
                responseBody,
                responseTime,
            } = await api.searchConsumer(validSearch);

            await PerformanceTracker.track(
                rawResponse,
                "Meter Replacement Consumer Search API",
                rawResponse.url(),
                responseTime,
            );

            const assert = new AssertionEngine();
            const validation = new ValidationEngine();
            const validator = new ConsumerSearchValidator();

            // -------------------------
            // Assertion Engine
            // -------------------------

            validation.execute("Status Code", () =>
                assert.validateStatusCode(
                    rawResponse,
                    200,
                    responseBody,
                ),
            );

            validation.execute("Content Type", () =>
                assert.validateContentType(rawResponse),
            );

            validation.execute("Response Time", () =>
                assert.validateResponseTime(
                    responseTime,
                    maxResponseTime,
                ),
            );

            validation.execute("Sensitive Data", () =>
                assert.validateSensitiveData(responseBody),
            );

            validation.execute("Required Root Fields", () =>
                assert.validateRequiredFields(responseBody, [
                    "success",
                    "data",
                ]),
            );

            // -------------------------
            // Mapper
            // -------------------------

            const mapped =
                ConsumerSearchMapper.map(responseBody);

            const rows = mapped.data;

            // -------------------------
            // Validator
            // -------------------------

            validation.execute("Success Flag", () =>
                validator.validateSuccess(mapped.success),
            );

            validation.execute("Business Rules", () =>
                validator.validateBusinessRules(rows),
            );

            validation.execute("Data Is Array", () =>
                validator.validateDataIsArray(rows),
            );

            validation.execute("Total Records", () =>
                validator.validateTotalRecords(
                    rows,
                    mapped.totalRecords,
                ),
            );

            validation.execute("Maximum Search Limit", () =>
                validator.validateMaximumRecords(rows),
            );

            validation.execute("Search Limit", () =>
                validator.validateSearchLimit(rows),
            );

            validation.execute("Empty Search Response", () =>
                validator.validateEmptySearchResponse(rows),
            );

            if (rows.length > 0) {

                validation.execute("Required Fields", () =>
                    validator.validateRequiredFields(rows),
                );

                validation.execute("Consumer Object", () =>
                    validator.validateConsumerObject(rows),
                );

                validation.execute("No Extra Fields", () =>
                    validator.validateNoExtraFields(rows),
                );

                validation.execute("Consumer Id", () =>
                    validator.validateConsumerId(rows),
                );

                validation.execute("Consumer Id Range", () =>
                    validator.validateConsumerIdRange(rows),
                );

                validation.execute("Consumer Name", () =>
                    validator.validateConsumerName(rows),
                );

                validation.execute("Trimmed Consumer Name", () =>
                    validator.validateTrimmedConsumerName(rows),
                );

                validation.execute("Consumer Name Length", () =>
                    validator.validateConsumerNameLength(rows),
                );

                validation.execute("Consumer Name Characters", () =>
                    validator.validateConsumerNameCharacters(rows),
                );

                validation.execute("Consumer Name Not Numeric", () =>
                    validator.validateConsumerNameNotNumeric(rows),
                );

                validation.execute("Unique Consumer Id", () =>
                    validator.validateUniqueConsumerIds(rows),
                );

                validation.execute("No Duplicate Objects", () =>
                    validator.validateNoDuplicateObjects(rows),
                );

                validation.execute("No Null Values", () =>
                    validator.validateNoNullValues(rows),
                );

                validation.execute("No Undefined Values", () =>
                    validator.validateNoUndefinedValues(rows),
                );

                validation.execute("Alphabetic Search", () =>
                    validator.validateAlphabeticSearch(rows),
                );

                validation.execute("Numeric Search", () =>
                    validator.validateNumericSearch(rows),
                );

                validation.execute("Search Result Consistency", () =>
                    validator.validateSearchResultConsistency(rows),
                );

                validation.execute("Sorted Consumer Names", () =>
                    validator.validateSortedConsumerNames(rows),
                );

                validation.execute("Single Record Validation", () =>
                    validator.validateSingleRecord(rows),
                );

                validation.execute("Multiple Record Validation", () =>
                    validator.validateMultipleRecords(rows),
                );

                validation.execute("Response Integrity", () =>
                    validator.validateResponseIntegrity(rows),
                );
            }

            validation.printSummary(
                "Meter Replacement Consumer Search API",
                responseTime,
            );
        },
    );
});