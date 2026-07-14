import { test } from "../../../fixtures/api.fixture";
import { SubmissionDetailApi } from "../Api/submission-detail.api";
import { submissionDetailData } from "../Data/submission-detail.data";
import { SubmissionDetailMapper } from "../Mapper/submission-detail.mapper";
import { SubmissionDetailValidator } from "../Validator/submission-detail.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";

test.describe("Meter Replacement Submission Detail API", () => {

  test(
    "Validate Meter Replacement Submission Detail API",
    {
      tag: [
        "@meter-replacement",
        "@submission-detail",
        "@smoke",
      ],
    },

    async ({ authenticatedApi }) => {

      const api = new SubmissionDetailApi(
        authenticatedApi,
      );

      const {
        submissionId,
        maxResponseTime,
      } = submissionDetailData;

      const {
        rawResponse,
        responseBody,
        responseTime,
      } = await api.getSubmissionDetail(
        submissionId,
      );

      await PerformanceTracker.track(
        rawResponse,
        "Meter Replacement Submission Detail API",
        rawResponse.url(),
        responseTime,
      );

      const assert =
        new AssertionEngine();

      const validation =
        new ValidationEngine();

      const validator =
        new SubmissionDetailValidator();

      //-----------------------------------------------------
      // Assertion Engine
      //-----------------------------------------------------

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
            "id",
            "status",
            "createdDate",
            "completedDate",
            "consumer",
            "oldMeter",
            "newMeter",
            "replacementReason",
            "remarks",
            "latitude",
            "longitude",
            "submittedBy",
          ],
        ),
      );

      //-----------------------------------------------------
      // Mapper
      //-----------------------------------------------------

      const mapped =
        SubmissionDetailMapper.map(
          responseBody,
        );

      const {
        consumer,
        oldMeter,
        newMeter,
      } = mapped;

      //-----------------------------------------------------
      // Validator
      //-----------------------------------------------------

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

      validation.execute("Required Fields", () =>
        validator.validateRequiredFields(
          mapped,
        ),
      );

      validation.execute("Submission Id", () =>
        validator.validateSubmissionId(
          mapped,
        ),
      );

      validation.execute("Submission Status", () =>
        validator.validateSubmissionStatus(
          mapped,
        ),
      );

      validation.execute("Created Date", () =>
        validator.validateCreatedDate(
          mapped,
        ),
      );

      validation.execute("Completed Date", () =>
        validator.validateCompletedDate(
          mapped,
        ),
      );

      validation.execute("Consumer Object", () =>
        validator.validateConsumerObject(
          consumer,
        ),
      );

      validation.execute("Consumer Required Fields", () =>
        validator.validateConsumerRequiredFields(
          consumer,
        ),
      );

      validation.execute("Consumer Id", () =>
        validator.validateConsumerId(
          consumer,
        ),
      );

      validation.execute("Consumer Name", () =>
        validator.validateConsumerName(
          consumer,
        ),
      );

      validation.execute("Consumer Status", () =>
        validator.validateConsumerStatus(
          consumer,
        ),
      );

      validation.execute("Consumer Identity", () =>
        validator.validateConsumerIdentity(
          consumer,
        ),
      );

      validation.execute("Old Meter Object", () =>
        validator.validateOldMeterObject(
          oldMeter,
        ),
      );

      validation.execute("Old Meter Required Fields", () =>
        validator.validateOldMeterRequiredFields(
          oldMeter,
        ),
      );

      validation.execute("Old Meter Lookup Id", () =>
        validator.validateOldMeterLookupId(
          oldMeter,
        ),
      );

      validation.execute("Old Meter Serial", () =>
        validator.validateOldMeterSerial(
          oldMeter,
        ),
      );

      validation.execute("Old Meter Status", () =>
        validator.validateOldMeterStatus(
          oldMeter,
        ),
      );

      validation.execute("New Meter Object", () =>
        validator.validateNewMeterObject(
          newMeter,
        ),
      );

      validation.execute("New Meter Required Fields", () =>
        validator.validateNewMeterRequiredFields(
          newMeter,
        ),
      );

      validation.execute("New Meter Lookup Id", () =>
        validator.validateNewMeterLookupId(
          newMeter,
        ),
      );

      validation.execute("New Meter Serial", () =>
        validator.validateNewMeterSerial(
          newMeter,
        ),
      );

      validation.execute("New Meter Status", () =>
        validator.validateNewMeterStatus(
          newMeter,
        ),
      );

      validation.execute("Submitted By", () =>
        validator.validateSubmittedBy(
          mapped,
        ),
      );

      validation.execute("Coordinates", () =>
        validator.validateCoordinates(
          mapped,
        ),
      );

      validation.execute("No Null Critical Fields", () =>
        validator.validateNoNullCriticalFields(
          mapped,
        ),
      );

      validation.execute("Business Rules", () =>
        validator.validateBusinessRules(
          mapped,
        ),
      );

      // -------- Continue in Part 4B --------

      validation.execute("Consumer Trim", () =>
        validator.validateConsumerTrim(
          consumer,
        ),
      );

      validation.execute("Old Meter Trim", () =>
        validator.validateOldMeterTrim(
          oldMeter,
        ),
      );

      validation.execute("New Meter Trim", () =>
        validator.validateNewMeterTrim(
          newMeter,
        ),
      );

      validation.execute("Replacement Reason", () =>
        validator.validateReplacementReason(
          mapped,
        ),
      );

      validation.execute("Remarks", () =>
        validator.validateRemarks(
          mapped,
        ),
      );

      validation.execute("Coordinate Range", () =>
        validator.validateCoordinateRange(
          mapped,
        ),
      );

      validation.execute("Coordinate Precision", () =>
        validator.validateCoordinatePrecision(
          mapped,
        ),
      );

      validation.execute("Submitted By Trim", () =>
        validator.validateSubmittedByTrim(
          mapped,
        ),
      );

      validation.execute("Old And New Meters Different", () =>
        validator.validateOldAndNewMetersDifferent(
          mapped,
        ),
      );

      validation.execute("Consumer IVRS Consistency", () =>
        validator.validateConsumerIvrsConsistency(
          consumer,
        ),
      );

      validation.execute("Old Meter Reading Format", () =>
        validator.validateReadingFormat(
          oldMeter,
        ),
      );

      validation.execute("New Meter Reading Format", () =>
        validator.validateReadingFormat(
          newMeter,
        ),
      );

      validation.execute("Meter Lookup Relationship", () =>
        validator.validateMeterLookupRelationship(
          oldMeter,
          newMeter,
        ),
      );

      validation.execute("Response Integrity", () =>
        validator.validateResponseIntegrity(
          mapped,
        ),
      );

      validation.execute("No Undefined Critical Fields", () =>
        validator.validateNoUndefinedCriticalFields(
          mapped,
        ),
      );

      validation.execute("Root Object Size", () =>
        validator.validateObjectSize(
          mapped,
        ),
      );

      validation.execute("Consumer Object Size", () =>
        validator.validateConsumerObjectSize(
          consumer,
        ),
      );

      validation.execute("Old Meter Object Size", () =>
        validator.validateMeterObjectSize(
          oldMeter,
        ),
      );

      validation.execute("New Meter Object Size", () =>
        validator.validateMeterObjectSize(
          newMeter,
        ),
      );

      validation.execute("No Extra Root Fields", () =>
        validator.validateNoExtraRootFields(
          mapped,
        ),
      );

      validation.execute("Consumer Status Business Rule", () =>
        validator.validateConsumerStatusBusinessRule(
          consumer,
        ),
      );

      validation.execute("Old Meter Status Business Rule", () =>
        validator.validateMeterStatusBusinessRule(
          oldMeter,
        ),
      );

      validation.execute("New Meter Status Business Rule", () =>
        validator.validateMeterStatusBusinessRule(
          newMeter,
        ),
      );

      validation.execute("Completed Submission Rule", () =>
        validator.validateCompletedSubmissionRule(
          mapped,
        ),
      );

      validation.execute("Pending Submission Rule", () =>
        validator.validatePendingSubmissionRule(
          mapped,
        ),
      );

      validation.execute("Submitted By Length", () =>
        validator.validateSubmittedByLength(
          mapped,
        ),
      );

      validation.execute("Consumer Name Length", () =>
        validator.validateConsumerNameLength(
          consumer,
        ),
      );

      validation.execute("Old Meter Serial Length", () =>
        validator.validateMeterSerialLength(
          oldMeter,
        ),
      );

      validation.execute("New Meter Serial Length", () =>
        validator.validateMeterSerialLength(
          newMeter,
        ),
      );

      validation.printSummary(
        "Meter Replacement Submission Detail API",
        responseTime,
      );
    },
  );
});