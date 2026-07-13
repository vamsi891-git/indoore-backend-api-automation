import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { CreateMeterApi } from "../Api/create-meter.api";
import { CreateConsumerApi } from "../Api/create-consumer.api";
import { ConsumerProfileApi } from "../../CONSUMERS/Api/consumerprofile.api";
import { ValidateMeterApi } from "../../CONSUMERS/Api/validatemeter.api";
import { ValidateMeterMapper } from "../../CONSUMERS/Mapper/validatemeter.mapper";
import { ValidateMeterValidator } from "../../CONSUMERS/Validator/validatemeter.validator";
import {
  buildCreateMeterRequest,
  createMeterMaxResponseTimeMs,
} from "../Data/create-meter.data";
import {
  buildValidCreateConsumerRequest,
  createConsumerData,
  createConsumerMaxResponseTimeMs,
  ensureBulkConsumerNearestAcctId,
  hasBulkConsumerNearestAcctId,
  setCreateConsumerMeterContext,
} from "../Data/create-consumer.data";
import { CreateMeterMapper } from "../Mapper/create-meter.mapper";
import { CreateConsumerMapper } from "../Mapper/create-consumer.mapper";
import { CreateMeterValidator } from "../Validator/create-meter.validator";
import { CreateConsumerValidator } from "../Validator/create-consumer.validator";
import { MasterDataCommonValidator } from "../Validator/master-data-common.validator";
import { CreateMeterSuccessResponseSchema } from "../schemas/master-data.schemas";
import { ensureMeterManufacturerContext } from "../utils/meter-manufacturer.helper";
import { ensureConsumerLookupContext } from "../utils/consumer-lookup.helper";
import { resolveConsumerMeterCascadeContext } from "../utils/network-hierarchy-cascade.helper";

const E2E_LABEL =
  "E2E: create meter → validate meter → create consumer → profile";
const VALIDATE_SETTLE_MS = 1500;
const VALIDATE_RETRIES = 6;

async function sleep(ms: number): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, ms));
}

test.describe("Meter → Consumer E2E", () => {
  test.describe.configure({ mode: "serial", retries: 1 });
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  test.beforeAll(async ({ authenticatedApi }) => {
    test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);
    await ensureMeterManufacturerContext(authenticatedApi);
    await ensureConsumerLookupContext(authenticatedApi);
    await ensureBulkConsumerNearestAcctId(authenticatedApi);
  });

  test(
    E2E_LABEL,
    {
      tag: [
        "@e2e",
        "@master-data",
        "@create-meter",
        "@create-consumer",
        "@validate-meter",
      ],
    },
    async ({ authenticatedApi }) => {
      if (!hasBulkConsumerNearestAcctId()) {
        test.skip(
          true,
          "No valid Nearest Acct. ID resolved from consumer master or env",
        );
        return;
      }

      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const meterValidator = new CreateMeterValidator();
      const validateMeterValidator = new ValidateMeterValidator();
      const consumerValidator = new CreateConsumerValidator();

      // ── 1. Create meter ──────────────────────────────────────────────────
      const meterPayload = {
        ...buildCreateMeterRequest(`e2e-${Date.now()}`),
        meterStatus: true,
      };
      const meterSerial = meterPayload.meterSerialNumber;
      const createMeterApi = new CreateMeterApi(authenticatedApi);
      const meterResult = await createMeterApi.createMeter(meterPayload);
      console.log(JSON.stringify(meterResult.responseBody, null, 2));
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

      // ── 2. Validate meter (poll until assignable) ─────────────────────────
      const validateMeterApi = new ValidateMeterApi(authenticatedApi);
      const orgLookupId = createConsumerData.organisationLookupId || undefined;
      let validateResult = await validateMeterApi.validateMeter(
        meterSerial,
        orgLookupId,
      );
      let validateData = ValidateMeterMapper.mapData(validateResult.responseBody);

      for (
        let attempt = 0;
        attempt < VALIDATE_RETRIES &&
        !(validateData.valid === true && validateData.meterExists === true);
        attempt += 1
      ) {
        await sleep(VALIDATE_SETTLE_MS);
        validateResult = await validateMeterApi.validateMeter(
          meterSerial,
          orgLookupId,
        );
        validateData = ValidateMeterMapper.mapData(validateResult.responseBody);
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
      validation.execute("Validate Meter Assignable", () =>
        validateMeterValidator.validateScenario(
          validateResult.responseBody,
          "assignable",
          meterSerial,
        ),
      );

      const cascadeContext = await resolveConsumerMeterCascadeContext(
        authenticatedApi,
        {
          meterLookupId: validateData.meterLookupId,
          networkLookupId: validateData.networkLookupId,
        },
        validateData.organisationLookupId ??
          createConsumerData.organisationLookupId,
      );
      if (!cascadeContext) {
        test.skip(
          true,
          "Could not resolve Zone → Sub Station → Feeder → DTR cascade for consumer create",
        );
        return;
      }
      setCreateConsumerMeterContext(cascadeContext);

      // ── 3. Create consumer (assign via MSN) ───────────────────────────────
      const consumerPayload = buildValidCreateConsumerRequest({
        label: "meter-e2e",
        meterSerial,
      });
      const consumerCid = String(consumerPayload["Consumer ID"] ?? "");
      expect(String(consumerPayload.MSN ?? "")).toBe(meterSerial);

      const createConsumerApi = new CreateConsumerApi(authenticatedApi);
      let consumerResult =
        await createConsumerApi.createConsumer(consumerPayload);

      // Brief retry if create races meter indexing / collision.
      if ([400, 409].includes(consumerResult.rawResponse.status())) {
        await sleep(2000);
        consumerResult =
          await createConsumerApi.createConsumer(consumerPayload);
      }
      console.log(JSON.stringify(consumerResult.responseBody, null, 2));

      const consumerMapped = CreateConsumerMapper.map(
        consumerResult.responseBody,
      );

      await PerformanceTracker.track(
        consumerResult.rawResponse,
        `${E2E_LABEL} — create consumer`,
        consumerResult.rawResponse.url(),
        consumerResult.responseTime,
      );

      validation.execute("Create Consumer Status", () =>
        expect(consumerResult.rawResponse.status()).toBe(201),
      );
      validation.execute("Create Consumer Content-Type", () =>
        assert.validateContentType(consumerResult.rawResponse),
      );
      validation.execute("Create Consumer Response Time", () =>
        assert.validateResponseTime(
          consumerResult.responseTime,
          createConsumerMaxResponseTimeMs,
        ),
      );
      validation.execute("Create Consumer Backend Rules", () =>
        consumerValidator.validateScenario(
          consumerMapped,
          "create_success",
          consumerPayload,
        ),
      );
      expect(String(consumerMapped.data?.MSN ?? "").trim()).toBe(meterSerial);

      // ── 4. Consumer profile persistence ──────────────────────────────────
      const profileApi = new ConsumerProfileApi(authenticatedApi);
      const profileResult = await profileApi.getConsumerProfile(
        consumerCid,
        createConsumerData.profileQuery,
      );

      await PerformanceTracker.track(
        profileResult.rawResponse,
        `${E2E_LABEL} — consumer profile`,
        profileResult.rawResponse.url(),
        profileResult.responseTime,
      );

      validation.execute("Profile Status", () =>
        assert.validateStatusCode(
          profileResult.rawResponse,
          200,
          profileResult.responseBody,
        ),
      );
      validation.execute("Profile Matches Create Request", () =>
        consumerValidator.validatePostCreateProfileBackendRules(
          profileResult.responseBody,
          consumerPayload,
        ),
      );

      validation.printSummary(E2E_LABEL, consumerResult.responseTime);
    },
  );
});
