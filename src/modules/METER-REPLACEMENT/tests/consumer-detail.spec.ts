import { test } from "../../../fixtures/api.fixture";
import { ConsumerDetailApi } from "../Api/consumer-detail.api";
import { consumerDetailData } from "../Data/consumer-detail.data";
import { ConsumerDetailMapper } from "../Mapper/consumer-detail.mapper";
import { ConsumerDetailValidator } from "../Validator/consumer-detail.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
test.describe("Meter Replacement Consumer Detail API", () => {
  test("Validate Meter Replacement Consumer Detail API",
    {
      tag: [
        "@meter-replacement",
        "@consumer-detail",
        "@smoke",
      ],
    },
    async ({ authenticatedApi }) => {
      const api = new ConsumerDetailApi(authenticatedApi);
      const { consumerId, maxResponseTime } = consumerDetailData;
      const { rawResponse, responseBody, responseTime } =
        await api.getConsumerDetail(consumerId);
      await PerformanceTracker.track(
        rawResponse,
        "Meter Replacement Consumer Detail API",
        rawResponse.url(),
        responseTime,
      );
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new ConsumerDetailValidator();
      validation.execute("Status Code", () =>
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
      validation.execute("Required Root Fields", () =>
        assert.validateRequiredFields(responseBody, ["success", "data"]),
      );
      const mapped = ConsumerDetailMapper.map(responseBody);
      validation.execute("Success", () =>
        validator.validateSuccess(responseBody.success),
      );
      validation.execute("Root Structure", () =>
        validator.validateRootStructure(mapped),
      );
      validation.execute("Required Fields", () =>
        validator.validateRequiredFields(mapped),
      );
      validation.execute("Consumer", () =>
        validator.validateConsumer(mapped),
      );
      validation.execute("Consumer Trim", () =>
        validator.validateConsumerTrim(mapped),
      );
      validation.execute("Consumer Length", () =>
        validator.validateConsumerLength(mapped),
      );
      validation.execute("IVRS", () => validator.validateIvrs(mapped));
      validation.execute("IVRS Trim", () =>
        validator.validateIvrsTrim(mapped),
      );
      validation.execute("RR Number", () =>
        validator.validateRrNumber(mapped),
      );
      validation.execute("Consumer Id", () =>
        validator.validateConsumerId(mapped),
      );
      validation.execute("Consumer CID", () =>
        validator.validateConsumerCid(mapped),
      );
      validation.execute("Account Id", () =>
        validator.validateAccountId(mapped),
      );
      validation.execute("Service Point Id", () =>
        validator.validateServicePointId(mapped),
      );
      validation.execute("Address", () =>
        validator.validateAddress(mapped),
      );
      validation.execute("Zone", () => validator.validateZone(mapped));
      validation.execute("Office", () =>
        validator.validateOffice(mapped),
      );
      validation.execute("Old Meter Lookup Id", () =>
        validator.validateOldMeterLookupId(mapped),
      );
      validation.execute("Old Meter Serial", () =>
        validator.validateOldMeterSerial(mapped),
      );
      validation.execute("Old Meter Status", () =>
        validator.validateOldMeterStatus(mapped),
      );
      validation.execute("Consumer Status", () =>
        validator.validateConsumerStatus(mapped),
      );
      validation.execute("Latitude", () =>
        validator.validateLatitude(mapped),
      );
      validation.execute("Longitude", () =>
        validator.validateLongitude(mapped),
      );
      validation.execute("Replacement Eligible", () =>
        validator.validateReplacementEligible(mapped),
      );
      validation.execute("No Null Values", () =>
        validator.validateNoNullValues(mapped),
      );
      validation.execute("No Undefined Values", () =>
        validator.validateNoUndefinedValues(mapped),
      );
      validation.execute("Consumer Identity", () =>
        validator.validateConsumerIdentity(mapped),
      );
      validation.execute("Meter Identity", () =>
        validator.validateMeterIdentity(mapped),
      );
      validation.execute("Location Identity", () =>
        validator.validateLocationIdentity(mapped),
      );
      validation.execute("IVRS Equals RR Number", () =>
        validator.validateIvrsEqualsRrNumber(mapped),
      );
      validation.execute("Consumer CID Consistency", () =>
        validator.validateConsumerCidConsistency(mapped),
      );
      validation.execute("Account Id Consistency", () =>
        validator.validateAccountIdConsistency(mapped),
      );
      validation.execute("Service Point Trim", () =>
        validator.validateServicePointTrim(mapped),
      );
      validation.execute("Address Trim", () =>
        validator.validateAddressTrim(mapped),
      );
      validation.execute("Office Trim", () =>
        validator.validateOfficeTrim(mapped),
      );
      validation.execute("Zone Trim", () =>
        validator.validateZoneTrim(mapped),
      );
      validation.execute("Old Meter Serial Trim", () =>
        validator.validateOldMeterSerialTrim(mapped),
      );
      validation.execute("Latitude Trim", () =>
        validator.validateLatitudeTrim(mapped),
      );
      validation.execute("Longitude Trim", () =>
        validator.validateLongitudeTrim(mapped),
      );
      validation.execute("Latitude Range", () =>
        validator.validateLatitudeRange(mapped),
      );
      validation.execute("Longitude Range", () =>
        validator.validateLongitudeRange(mapped),
      )
      validation.execute("Coordinate Precision", () =>
        validator.validateCoordinatePrecision(mapped),
      );
      validation.execute("Active Consumer Rule", () =>
        validator.validateActiveConsumerRule(mapped),
      );
      validation.execute("Active Meter Rule", () =>
        validator.validateActiveMeterRule(mapped),
      );
      validation.execute("Replacement Eligibility Rule", () =>
        validator.validateReplacementEligibilityRule(mapped),
      );
      validation.execute("Replacement Ineligible Rule", () =>
        validator.validateReplacementIneligibleRule(mapped),
      );
      validation.execute("Meter Lookup Relationship", () =>
        validator.validateMeterLookupRelationship(mapped),
      );
      validation.execute("Consumer Relationship", () =>
        validator.validateConsumerRelationship(mapped),
      );
      validation.execute("Location Relationship", () =>
        validator.validateLocationRelationship(mapped),
      );
      validation.execute("No Extra Fields", () =>
        validator.validateNoExtraFields(mapped),
      );
      validation.execute("Object Size", () =>
        validator.validateObjectSize(mapped),
      );
      validation.execute("Response Integrity", () =>
        validator.validateResponseIntegrity(mapped),
      );
      validation.execute("String Fields", () =>
        validator.validateStringFields(mapped),
      );
      validation.execute("Numeric Fields", () =>
        validator.validateNumericFields(mapped),
      );
      validation.execute("Boolean Field", () =>
        validator.validateBooleanField(mapped),
      );
      validation.execute("Status Fields", () =>
        validator.validateStatusFields(mapped),
      );
      validation.execute("Coordinate Consistency", () =>
        validator.validateCoordinateConsistency(mapped),
      );
      validation.execute("Business Rules", () =>
        validator.validateBusinessRules(mapped),
      );
      validation.printSummary(
        "Meter Replacement Consumer Detail API",
        responseTime,
      );
    },
  );
});
