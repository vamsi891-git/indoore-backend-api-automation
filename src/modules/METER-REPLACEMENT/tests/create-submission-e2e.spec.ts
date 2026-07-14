import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { CreateMeterApi } from "../../MASTER-DATA/Api/create-meter.api";
import {
  buildCreateMeterRequest,
  createMeterMaxResponseTimeMs,
} from "../../MASTER-DATA/Data/create-meter.data";
import { CreateMeterMapper } from "../../MASTER-DATA/Mapper/create-meter.mapper";
import { CreateMeterValidator } from "../../MASTER-DATA/Validator/create-meter.validator";
import { MasterDataCommonValidator } from "../../MASTER-DATA/Validator/master-data-common.validator";
import { CreateMeterSuccessResponseSchema } from "../../MASTER-DATA/schemas/master-data.schemas";
import { ensureMeterManufacturerContext } from "../../MASTER-DATA/utils/meter-manufacturer.helper";
import { CreateSubmissionApi } from "../Api/create-submission.api";
import { MeterValidationApi } from "../Api/meter-validation.api";
import { SubmissionDetailApi } from "../Api/submission-detail.api";
import {
  buildCreateSubmissionPayload,
  createSubmissionData,
} from "../Data/create-submission.data";
import { CreateSubmissionMapper } from "../Mapper/create-submission.mapper";
import { MeterValidationMapper } from "../Mapper/meter-validation.mapper";
import { CreateSubmissionValidator } from "../Validator/create-submission.validator";
import {
  findEligibleConsumer,
} from "../utils/create-submission.helper";
import { pauseMs } from "../utils/response.helper";

const E2E_LABEL =
  "E2E: create meter → validate → create meter replacement submission";
const VALIDATE_SETTLE_MS = 1_500;
const VALIDATE_RETRIES = 8;

test.describe("Meter Replacement Create Submission E2E", () => {
  test.describe.configure({ mode: "serial", retries: 1 });
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  test.beforeAll(async ({ authenticatedApi }) => {
    test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);
    await ensureMeterManufacturerContext(authenticatedApi);
  });

  test(
    E2E_LABEL,
    {
      tag: [
        "@e2e",
        "@smoke",
        "@meter-replacement",
        "@create-submission",
        "@create-meter",
      ],
    },
    async ({ authenticatedApi }) => {
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const meterValidator = new CreateMeterValidator();
      const createSubmissionValidator = new CreateSubmissionValidator();

      const consumer = await findEligibleConsumer(authenticatedApi);

      // ── 1. Create meter (new meter for replacement) ─────────────────────
      const meterPayload = {
        ...buildCreateMeterRequest(`mr-e2e-${Date.now()}`),
        meterStatus: true,
      };
      const meterSerial = meterPayload.meterSerialNumber;
      const createMeterApi = new CreateMeterApi(authenticatedApi);
      const meterResult = await createMeterApi.createMeter(meterPayload);
      const meterMapped = CreateMeterMapper.map(meterResult.responseBody);

      await PerformanceTracker.track(
        meterResult.rawResponse,
        `${E2E_LABEL} — create meter`,
        meterResult.rawResponse.url(),
        meterResult.responseTime,
      );

      validation.execute("Create Meter Status", () =>
        expect(meterResult.rawResponse.status()).toBe(201),
      );
      validation.execute("Create Meter Content-Type", () =>
        assert.validateContentType(meterResult.rawResponse),
      );
      validation.execute("Create Meter Response Time", () =>
        assert.validateResponseTime(
          meterResult.responseTime,
          createMeterMaxResponseTimeMs,
        ),
      );
      validation.execute("Create Meter Schema", () =>
        MasterDataCommonValidator.validateZodResponseSchema(
          meterResult.responseBody,
          CreateMeterSuccessResponseSchema,
        ),
      );
      validation.execute("Create Meter Backend Rules", () =>
        meterValidator.validateScenario(meterMapped, "success", meterPayload),
      );
      expect(String(meterMapped.data?.meterSerialNumber ?? "")).toBe(
        meterSerial,
      );

      // ── 2. Validate new meter for replacement eligibility ────────────────
      const validateApi = new MeterValidationApi(authenticatedApi);
      let validateResult = await validateApi.validateMeter(meterSerial);
      let validateMapped = MeterValidationMapper.map(
        validateResult.responseBody,
      );

      for (
        let attempt = 0;
        attempt < VALIDATE_RETRIES &&
        !(
          validateResult.rawResponse.status() === 200 &&
          validateMapped.valid === true &&
          validateMapped.meterLookupId > 0
        );
        attempt += 1
      ) {
        await pauseMs(VALIDATE_SETTLE_MS);
        validateResult = await validateApi.validateMeter(meterSerial);
        validateMapped = MeterValidationMapper.map(
          validateResult.responseBody,
        );
      }

      await PerformanceTracker.track(
        validateResult.rawResponse,
        `${E2E_LABEL} — validate meter`,
        validateResult.rawResponse.url(),
        validateResult.responseTime,
      );

      validation.execute("Validate Meter Status", () =>
        expect(validateResult.rawResponse.status()).toBe(200),
      );
      validation.execute("Validate Meter Eligible", () => {
        expect(validateMapped.valid).toBeTruthy();
        expect(validateMapped.meterLookupId).toBeGreaterThan(0);
        expect(validateMapped.meterSerial).toBe(meterSerial);
      });

      // ── 3. Create meter replacement submission ──────────────────────────
      const latitude = Number(consumer.latitude);
      const longitude = Number(consumer.longitude);
      const payload = buildCreateSubmissionPayload({
        consumerId: consumer.consumerId,
        oldMeterLookupId: consumer.oldMeterLookupId,
        oldMeterSerial: consumer.oldMeterSerial,
        newMeterLookupId: validateMapped.meterLookupId,
        newMeterSerial: validateMapped.meterSerial,
        latitude: Number.isFinite(latitude)
          ? latitude
          : createSubmissionData.defaultLatitude,
        longitude: Number.isFinite(longitude)
          ? longitude
          : createSubmissionData.defaultLongitude,
        remarks: "automation e2e create meter then replace",
      });

      const createApi = new CreateSubmissionApi(authenticatedApi);
      const createResult = await createApi.createSubmission(payload);
      const createMapped = CreateSubmissionMapper.map(
        createResult.responseBody,
      );

      await PerformanceTracker.track(
        createResult.rawResponse,
        `${E2E_LABEL} — create submission`,
        createResult.rawResponse.url(),
        createResult.responseTime,
      );

      validation.execute("Create Submission Status", () =>
        assert.validateStatusCode(
          createResult.rawResponse,
          createSubmissionData.expectedSuccessStatus,
          createResult.responseBody,
        ),
      );
      validation.execute("Create Submission Content-Type", () =>
        assert.validateContentType(createResult.rawResponse),
      );
      validation.execute("Create Submission Response Time", () =>
        assert.validateResponseTime(
          createResult.responseTime,
          createSubmissionData.maxResponseTime,
        ),
      );
      validation.execute("Create Submission Sensitive Data", () =>
        assert.validateSensitiveData(createResult.responseBody),
      );
      validation.execute("Create Submission Root Fields", () =>
        assert.validateRequiredFields(createResult.responseBody, [
          "success",
          "data",
        ]),
      );
      validation.execute("Create Submission Data Fields", () =>
        assert.validateRequiredFields(createResult.responseBody.data, [
          "id",
          "status",
        ]),
      );

      validation.execute("Create Submission Mapped Success", () =>
        createSubmissionValidator.validateSuccess(createMapped.success),
      );
      validation.execute("Create Submission Mapped Structure", () =>
        createSubmissionValidator.validateRootStructure(createMapped),
      );
      validation.execute("Create Submission Mapped Required", () =>
        createSubmissionValidator.validateRequiredFields(createMapped),
      );
      validation.execute("Create Submission Mapped Id", () =>
        createSubmissionValidator.validateId(createMapped),
      );
      validation.execute("Create Submission Mapped Status", () =>
        createSubmissionValidator.validateStatus(
          createMapped,
          createSubmissionData.expectedPendingStatus,
        ),
      );
      validation.execute("Create Submission Mapped Trim", () =>
        createSubmissionValidator.validateStatusTrim(createMapped),
      );
      validation.execute("Create Submission Mapped Nulls", () =>
        createSubmissionValidator.validateNoNullValues(createMapped),
      );
      validation.execute("Create Submission Mapped Undefined", () =>
        createSubmissionValidator.validateNoUndefinedValues(createMapped),
      );
      validation.execute("Create Submission Mapped Size", () =>
        createSubmissionValidator.validateObjectSize(createMapped),
      );
      validation.execute("Create Submission Mapped Keys", () =>
        createSubmissionValidator.validateNoExtraFields(createMapped),
      );
      validation.execute("Create Submission Pending Rule", () =>
        createSubmissionValidator.validatePendingBusinessRule(createMapped),
      );

      // ── 4. Submission detail reflects new submission ────────────────────
      const detailApi = new SubmissionDetailApi(authenticatedApi);
      const detail = await detailApi.getSubmissionDetail(createMapped.id);

      validation.execute("Submission Detail Status", () =>
        expect(detail.rawResponse.status()).toBe(200),
      );
      validation.execute("Submission Detail Identity", () => {
        expect(detail.responseBody.success).toBeTruthy();
        expect(detail.responseBody.data?.id).toBe(createMapped.id);
        expect(String(detail.responseBody.data?.status ?? "").toUpperCase()).toBe(
          "PENDING",
        );
        expect(detail.responseBody.data?.consumer?.consumerId).toBe(
          consumer.consumerId,
        );
        expect(detail.responseBody.data?.oldMeter?.meterSerial).toBe(
          consumer.oldMeterSerial,
        );
        expect(detail.responseBody.data?.newMeter?.meterSerial).toBe(
          meterSerial,
        );
      });

      validation.printSummary(E2E_LABEL, createResult.responseTime);
    },
  );
});
