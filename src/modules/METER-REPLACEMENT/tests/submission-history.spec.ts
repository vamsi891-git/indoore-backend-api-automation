import { test } from "../../../fixtures/api.fixture";
import { SubmissionHistoryApi } from "../Api/submission-history.api";
import { submissionHistoryData } from "../Data/submission-history.data";
import { SubmissionHistoryMapper } from "../Mapper/submission-history.mapper";
import { SubmissionHistoryValidator } from "../Validator/submission-history.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";

test.describe("Meter Replacement Submission History API", () => {

    test(
        "Validate Meter Replacement Submission History API",
        {
            tag: [
                "@meter-replacement",
                "@submission-history",
                "@smoke",
            ],
        },

        async ({ authenticatedApi }) => {

            const api = new SubmissionHistoryApi(authenticatedApi);

            const {
                page,
                limit,
                maxResponseTime,
            } = submissionHistoryData;

            const {
                rawResponse,
                responseBody,
                responseTime,
            } = await api.getSubmissionHistory(
                page,
                limit,
            );

            await PerformanceTracker.track(
                rawResponse,
                "Meter Replacement Submission History API",
                rawResponse.url(),
                responseTime,
            );

            const assert = new AssertionEngine();

            const validation =
                new ValidationEngine();

            const validator =
                new SubmissionHistoryValidator();

            //---------------------------------------------------
            // Assertion Engine
            //---------------------------------------------------

            validation.execute("Status Code", () =>
                assert.validateStatusCode(
                    rawResponse,
                    200,
                    responseBody,
                ),
            );

            validation.execute("Content Type", () =>
                assert.validateContentType(
                    rawResponse,
                ),
            );

            validation.execute("Response Time", () =>
                assert.validateResponseTime(
                    responseTime,
                    maxResponseTime,
                ),
            );

            validation.execute("Sensitive Data", () =>
                assert.validateSensitiveData(
                    responseBody,
                ),
            );

            validation.execute("Required Root Fields", () =>
                assert.validateRequiredFields(
                    responseBody,
                    [
                        "success",
                        "data",
                    ],
                ),
            );

            validation.execute("Required Data Fields", () =>
                assert.validateRequiredFields(
                    responseBody.data,
                    [
                        "items",
                        "pagination",
                    ],
                ),
            );

            //---------------------------------------------------
            // Mapper
            //---------------------------------------------------

            const mapped =
                SubmissionHistoryMapper.map(
                    responseBody,
                );

            const {
                items,
                pagination,
            } = mapped;

            //---------------------------------------------------
            // Validator
            //---------------------------------------------------

            validation.execute("Success", () =>
                validator.validateSuccess(
                    mapped.success,
                ),
            );

            validation.execute("Root Structure", () =>
                validator.validateRootStructure(
                    mapped,
                ),
            );

            validation.execute("Items Array", () =>
                validator.validateItemsArray(
                    mapped,
                ),
            );

            validation.execute("Pagination Object", () =>
                validator.validatePaginationObject(
                    mapped,
                ),
            );

            validation.execute("Pagination Required Fields", () =>
                validator.validatePaginationRequiredFields(
                    pagination,
                ),
            );

            validation.execute("Pagination Types", () =>
                validator.validatePaginationTypes(
                    pagination,
                ),
            );

            validation.execute("Page", () =>
                validator.validatePage(
                    pagination,
                ),
            );

            validation.execute("Limit", () =>
                validator.validateLimit(
                    pagination,
                ),
            );

            validation.execute("Total", () =>
                validator.validateTotal(
                    pagination,
                ),
            );

            validation.execute("Total Pages", () =>
                validator.validateTotalPages(
                    pagination,
                ),
            );

            validation.execute("Pagination Math", () =>
                validator.validatePaginationMath(
                    pagination,
                ),
            );

            validation.execute("Items Limit", () =>
                validator.validateItemsLimit(
                    mapped,
                ),
            );

            validation.execute("Empty Result", () =>
                validator.validateEmptyResult(
                    mapped,
                ),
            );

            validation.execute("Rows Present", () =>
                validator.validateRowsPresent(
                    mapped,
                ),
            );

            if (items.length > 0) {

                validation.execute("Required Fields", () =>
                    validator.validateRequiredFields(
                        items,
                    ),
                );

                validation.execute("Id", () =>
                    validator.validateId(
                        items,
                    ),
                );

                validation.execute("Consumer Name", () =>
                    validator.validateConsumerName(
                        items,
                    ),
                );

                validation.execute("Old Meter Serial", () =>
                    validator.validateOldMeterSerial(
                        items,
                    ),
                );

                validation.execute("New Meter Serial", () =>
                    validator.validateNewMeterSerial(
                        items,
                    ),
                );

                validation.execute("Replacement Reason", () =>
                    validator.validateReplacementReason(
                        items,
                    ),
                );

                validation.execute("Status", () =>
                    validator.validateStatus(
                        items,
                    ),
                );

                validation.execute("Created Date", () =>
                    validator.validateCreatedDate(
                        items,
                    ),
                );

                validation.execute("Unique Ids", () =>
                    validator.validateUniqueIds(
                        items,
                    ),
                );

                validation.execute("Single Record", () =>
                    validator.validateSingleRecord(
                        items,
                    ),
                );

                validation.execute("Multiple Records", () =>
                    validator.validateMultipleRecords(
                        items,
                    ),
                );

                // -------- Continue in Part 4B --------

                validation.execute("Consumer Name Trim", () =>
                  validator.validateConsumerNameTrim(
                      items,
                  ),
              );

              validation.execute("Old Meter Serial Trim", () =>
                  validator.validateOldMeterSerialTrim(
                      items,
                  ),
              );

              validation.execute("New Meter Serial Trim", () =>
                  validator.validateNewMeterSerialTrim(
                      items,
                  ),
              );

              validation.execute("Replacement Reason Trim", () =>
                  validator.validateReplacementReasonTrim(
                      items,
                  ),
              );

              validation.execute("Created Date Trim", () =>
                  validator.validateCreatedDateTrim(
                      items,
                  ),
              );

              validation.execute("Business Rules", () =>
                  validator.validateBusinessRules(
                      mapped,
                  ),
              );

              validation.execute("Pagination Consistency", () =>
                  validator.validatePaginationConsistency(
                      mapped,
                  ),
              );

              validation.execute("No Duplicate Records", () =>
                  validator.validateNoDuplicateRecords(
                      items,
                  ),
              );

              validation.execute("No Extra Fields", () =>
                  validator.validateNoExtraFields(
                      items,
                  ),
              );

              validation.execute("Item Object Size", () =>
                  validator.validateItemObjectSize(
                      items,
                  ),
              );

              validation.execute("Response Integrity", () =>
                  validator.validateResponseIntegrity(
                      items,
                  ),
              );

              validation.execute("String Fields", () =>
                  validator.validateStringFields(
                      items,
                  ),
              );

              validation.execute("Numeric Fields", () =>
                  validator.validateNumericFields(
                      items,
                      pagination,
                  ),
              );

              validation.execute("Status Distribution", () =>
                  validator.validateStatusDistribution(
                      items,
                  ),
              );

              validation.execute("Pagination Range", () =>
                  validator.validatePaginationRange(
                      pagination,
                  ),
              );

              validation.execute("Items When Total Positive", () =>
                  validator.validateItemsWhenTotalPositive(
                      mapped,
                  ),
              );

              validation.execute("History Ordering", () =>
                  validator.validateHistoryOrdering(
                      items,
                  ),
              );

              validation.execute("Consumer Name Length", () =>
                  validator.validateConsumerNameLength(
                      items,
                  ),
              );

              validation.execute("Meter Serial Length", () =>
                  validator.validateMeterSerialLength(
                      items,
                  ),
              );

              validation.execute("Replacement Reason Length", () =>
                  validator.validateReplacementReasonLength(
                      items,
                  ),
              );

              validation.execute("No Null Critical Fields", () =>
                  validator.validateNoNullCriticalFields(
                      items,
                  ),
              );

              validation.execute("No Undefined Critical Fields", () =>
                  validator.validateNoUndefinedCriticalFields(
                      items,
                  ),
              );
          }

          validation.printSummary(
              "Meter Replacement Submission History API",
              responseTime,
          );
      },
  );
});