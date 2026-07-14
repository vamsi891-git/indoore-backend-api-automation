import { test } from "../../../fixtures/api.fixture";
import { DashboardSummaryApi } from "../Api/dashboard-summary.api";
import { dashboardSummaryData } from "../Data/dashboard-summary.data";
import { DashboardSummaryMapper } from "../Mapper/dashboard-summary.mapper";
import { DashboardSummaryValidator } from "../Validator/dashboard-summary.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";

test.describe("Meter Replacement Dashboard Summary API", () => {

    test(
        "Validate Meter Replacement Dashboard Summary API",
        {
            tag: [
                "@meter-replacement",
                "@dashboard-summary",
                "@smoke",
            ],
        },

        async ({ authenticatedApi }) => {

            const api = new DashboardSummaryApi(
                authenticatedApi,
            );

            const {
                maxResponseTime,
            } = dashboardSummaryData;

            const {
                rawResponse,
                responseBody,
                responseTime,
            } = await api.getDashboardSummary();

            await PerformanceTracker.track(
                rawResponse,
                "Meter Replacement Dashboard Summary API",
                rawResponse.url(),
                responseTime,
            );

            const assert =
                new AssertionEngine();

            const validation =
                new ValidationEngine();

            const validator =
                new DashboardSummaryValidator();

            //----------------------------------------------------
            // Assertion Engine
            //----------------------------------------------------

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
                        "overall",
                        "myWork",
                    ],
                ),
            );

            //----------------------------------------------------
            // Mapper
            //----------------------------------------------------

            const mapped =
                DashboardSummaryMapper.map(
                    responseBody,
                );

            const {
                overall,
                myWork,
            } = mapped;

            //----------------------------------------------------
            // Validator
            //----------------------------------------------------

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

            validation.execute("Overall Object", () =>
                validator.validateOverallObject(
                    overall,
                ),
            );

            validation.execute("My Work Object", () =>
                validator.validateMyWorkObject(
                    myWork,
                ),
            );

            validation.execute("Overall Required Fields", () =>
                validator.validateOverallRequiredFields(
                    overall,
                ),
            );

            validation.execute("My Work Required Fields", () =>
                validator.validateMyWorkRequiredFields(
                    myWork,
                ),
            );

            validation.execute("Overall Types", () =>
                validator.validateOverallTypes(
                    overall,
                ),
            );

            validation.execute("My Work Types", () =>
                validator.validateMyWorkTypes(
                    myWork,
                ),
            );

            validation.execute("Total Meters Requested", () =>
                validator.validateTotalMetersRequested(
                    overall,
                ),
            );

            validation.execute("Total Meters Replaced", () =>
                validator.validateTotalMetersReplaced(
                    overall,
                ),
            );

            validation.execute("Total Pending Meters", () =>
                validator.validateTotalPendingMeters(
                    overall,
                ),
            );

            validation.execute("Total Unmapped Meters", () =>
                validator.validateTotalUnmappedMeters(
                    overall,
                ),
            );

            validation.execute("Completed Today", () =>
                validator.validateCompletedToday(
                    myWork,
                ),
            );

            validation.execute("Completed This Month", () =>
                validator.validateCompletedThisMonth(
                    myWork,
                ),
            );

            validation.execute("Total Completed", () =>
                validator.validateTotalCompleted(
                    myWork,
                ),
            );

            validation.execute("Latest Completed Date", () =>
                validator.validateLatestCompletedDate(
                    myWork,
                ),
            );

            validation.execute("Overall Integer Values", () =>
                validator.validateOverallIntegerValues(
                    overall,
                ),
            );

            validation.execute("My Work Integer Values", () =>
                validator.validateMyWorkIntegerValues(
                    myWork,
                ),
            );

            validation.execute("No Null Critical Fields", () =>
                validator.validateNoNullCriticalFields(
                    mapped,
                ),
            );

            validation.execute("No Undefined Critical Fields", () =>
                validator.validateNoUndefinedCriticalFields(
                    mapped,
                ),
            );

            validation.execute("Business Rules", () =>
                validator.validateBusinessRules(
                    mapped,
                ),
            );

            // ---------- Continue in Part 4B ----------
            validation.execute("Overall Business Rule", () =>
              validator.validateOverallBusinessRule(
                  overall,
              ),
          );

          validation.execute("My Work Business Rule", () =>
              validator.validateMyWorkBusinessRule(
                  myWork,
              ),
          );

          validation.execute("Overall Object Size", () =>
              validator.validateOverallObjectSize(
                  overall,
              ),
          );

          validation.execute("My Work Object Size", () =>
              validator.validateMyWorkObjectSize(
                  myWork,
              ),
          );

          validation.execute("Overall No Extra Fields", () =>
              validator.validateOverallNoExtraFields(
                  overall,
              ),
          );

          validation.execute("My Work No Extra Fields", () =>
              validator.validateMyWorkNoExtraFields(
                  myWork,
              ),
          );

          validation.execute("Latest Completed Date Trim", () =>
              validator.validateLatestCompletedDateTrim(
                  myWork,
              ),
          );

          validation.execute("Latest Completed Date Business Rule", () =>
              validator.validateLatestCompletedDateBusinessRule(
                  myWork,
              ),
          );

          validation.execute("Overall Response Integrity", () =>
              validator.validateOverallResponseIntegrity(
                  overall,
              ),
          );

          validation.execute("My Work Response Integrity", () =>
              validator.validateMyWorkResponseIntegrity(
                  myWork,
              ),
          );

          validation.execute("Overall Safe Integer", () =>
              validator.validateOverallSafeInteger(
                  overall,
              ),
          );

          validation.execute("My Work Safe Integer", () =>
              validator.validateMyWorkSafeInteger(
                  myWork,
              ),
          );

          validation.execute("Overall Non Negative", () =>
              validator.validateOverallNonNegative(
                  overall,
              ),
          );

          validation.execute("My Work Non Negative", () =>
              validator.validateMyWorkNonNegative(
                  myWork,
              ),
          );

          validation.execute("Requested Consistency", () =>
              validator.validateRequestedConsistency(
                  overall,
              ),
          );

          validation.execute("Completed Counts Consistency", () =>
              validator.validateCompletedCountsConsistency(
                  myWork,
              ),
          );

          validation.execute("Zero Dashboard Scenario", () =>
              validator.validateZeroDashboardScenario(
                  overall,
                  myWork,
              ),
          );

          validation.execute("Completed Date Presence", () =>
              validator.validateCompletedDatePresence(
                  myWork,
              ),
          );

          validation.execute("Overall Counts Relationship", () =>
              validator.validateOverallCountsRelationship(
                  overall,
              ),
          );

          validation.execute("Today Month Relationship", () =>
              validator.validateTodayMonthRelationship(
                  myWork,
              ),
          );

          validation.execute("Month Total Relationship", () =>
              validator.validateMonthTotalRelationship(
                  myWork,
              ),
          );

          validation.execute("Overall Numeric Fields", () =>
              validator.validateOverallNumericFields(
                  overall,
              ),
          );

          validation.execute("My Work Numeric Fields", () =>
              validator.validateMyWorkNumericFields(
                  myWork,
              ),
          );

          validation.printSummary(
              "Meter Replacement Dashboard Summary API",
              responseTime,
          );
      },
  );
});