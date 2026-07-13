import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { CreateMeterApi } from "../Api/create-meter.api";
import { CreateDtrApi } from "../Api/create-dtr.api";
import { CreateConsumerApi } from "../Api/create-consumer.api";
import { ValidateDtrMeterApi } from "../Api/validate-dtr-meter.api";
import { ValidateMeterApi } from "../../CONSUMERS/Api/validatemeter.api";
import { ConsumerProfileApi } from "../../CONSUMERS/Api/consumerprofile.api";
import { ValidateMeterMapper } from "../../CONSUMERS/Mapper/validatemeter.mapper";
import { ValidateMeterValidator } from "../../CONSUMERS/Validator/validatemeter.validator";
import {
  buildCreateMeterRequest,
  createMeterMaxResponseTimeMs,
} from "../Data/create-meter.data";
import {
  buildCreateDtrRequest,
  createDtrMaxResponseTimeMs,
} from "../Data/create-dtr.data";
import {
  buildValidCreateConsumerRequest,
  createConsumerData,
  createConsumerMaxResponseTimeMs,
  ensureBulkConsumerNearestAcctId,
  hasBulkConsumerNearestAcctId,
  setCreateConsumerMeterContext,
} from "../Data/create-consumer.data";
import { CreateMeterMapper } from "../Mapper/create-meter.mapper";
import { CreateDtrMapper } from "../Mapper/create-dtr.mapper";
import { CreateConsumerMapper } from "../Mapper/create-consumer.mapper";
import { CreateMeterValidator } from "../Validator/create-meter.validator";
import { CreateDtrValidator } from "../Validator/create-dtr.validator";
import { CreateConsumerValidator } from "../Validator/create-consumer.validator";
import { ValidateDtrMeterValidator } from "../Validator/validate-dtr-meter.validator";
import { MasterDataCommonValidator } from "../Validator/master-data-common.validator";
import {
  CreateDtrSuccessResponseSchema,
  CreateMeterSuccessResponseSchema,
} from "../schemas/master-data.schemas";
import { ensureMeterManufacturerContext } from "../utils/meter-manufacturer.helper";
import { ensureConsumerLookupContext } from "../utils/consumer-lookup.helper";
import {
  ensureNetworkHierarchyCascadeContext,
  getNetworkHierarchyCascade,
} from "../utils/network-hierarchy-cascade.helper";

/**
 * Full master-data chain:
 *   Meter A → validate-dtr-meter → create DTR
 *   Meter B → validate-meter → create consumer on that new DTR
 *   → consumer profile
 *
 * Two meters are required: a DTR-bound meter cannot also be assigned to a consumer.
 */
const E2E_LABEL =
  "E2E: create meter → assign to DTR → create meter → assign to consumer → profile";
const VALIDATE_SETTLE_MS = 1500;
const VALIDATE_RETRIES = 6;

async function sleep(ms: number): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, ms));
}

test.describe("Meter → DTR → Consumer E2E", () => {
  test.describe.configure({ mode: "serial", retries: 1 });
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  test.beforeAll(async ({ authenticatedApi }) => {
    test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);
    await ensureMeterManufacturerContext(authenticatedApi);
    await ensureConsumerLookupContext(authenticatedApi);
    await ensureBulkConsumerNearestAcctId(authenticatedApi);
    await ensureNetworkHierarchyCascadeContext(authenticatedApi);
  });

  test(
    E2E_LABEL,
    {
      tag: [
        "@e2e",
        "@master-data",
        "@create-meter",
        "@create-dtr",
        "@create-consumer",
        "@validate-dtr-meter",
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

      const cascade = getNetworkHierarchyCascade();
      if (
        !cascade?.subStationNetworkLookupId ||
        !cascade?.feederNetworkLookupId
      ) {
        test.skip(
          true,
          "Could not resolve Sub Station → Feeder cascade for create-dtr",
        );
        return;
      }

      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const meterValidator = new CreateMeterValidator();
      const validateDtrMeterValidator = new ValidateDtrMeterValidator();
      const validateMeterValidator = new ValidateMeterValidator();
      const dtrValidator = new CreateDtrValidator();
      const consumerValidator = new CreateConsumerValidator();
      const createMeterApi = new CreateMeterApi(authenticatedApi);

      // ════════════════════════════════════════════════════════════════════
      // Phase 1 — Meter A → DTR
      // ════════════════════════════════════════════════════════════════════
      const dtrMeterPayload = {
        ...buildCreateMeterRequest(`e2e-chain-dtr-${Date.now()}`),
        meterStatus: true,
      };
      const dtrMeterSerial = dtrMeterPayload.meterSerialNumber;
      const dtrMeterResult = await createMeterApi.createMeter(dtrMeterPayload);
      console.log(JSON.stringify(dtrMeterResult.responseBody, null, 2));
      const dtrMeterMapped = CreateMeterMapper.map(dtrMeterResult.responseBody);

      await PerformanceTracker.track(
        dtrMeterResult.rawResponse,
        `${E2E_LABEL} — create DTR meter`,
        dtrMeterResult.rawResponse.url(),
        dtrMeterResult.responseTime,
      );

      validation.execute("Create DTR Meter Status", () =>
        expect(dtrMeterResult.rawResponse.status()).toBe(201),
      );
      validation.execute("Create DTR Meter Schema", () =>
        MasterDataCommonValidator.validateZodResponseSchema(
          dtrMeterResult.responseBody,
          CreateMeterSuccessResponseSchema,
        ),
      );
      validation.execute("Create DTR Meter Backend Rules", () =>
        meterValidator.validateScenario(
          dtrMeterMapped,
          "success",
          dtrMeterPayload,
        ),
      );

      const validateDtrMeterApi = new ValidateDtrMeterApi(authenticatedApi);
      let dtrValidateResult = await validateDtrMeterApi.validateDtrMeter({
        meterSerialNumber: dtrMeterSerial,
      });
      let dtrValidateData = dtrValidateResult.responseBody.data;

      for (
        let attempt = 0;
        attempt < VALIDATE_RETRIES &&
        !(
          dtrValidateResult.responseBody.success &&
          dtrValidateData?.valid === true &&
          dtrValidateData?.meterExists === true
        );
        attempt += 1
      ) {
        await sleep(VALIDATE_SETTLE_MS);
        dtrValidateResult = await validateDtrMeterApi.validateDtrMeter({
          meterSerialNumber: dtrMeterSerial,
        });
        dtrValidateData = dtrValidateResult.responseBody.data;
      }

      await PerformanceTracker.track(
        dtrValidateResult.rawResponse,
        `${E2E_LABEL} — validate DTR meter`,
        dtrValidateResult.rawResponse.url(),
        dtrValidateResult.responseTime,
      );

      validation.execute("Validate DTR Meter Assignable", () =>
        validateDtrMeterValidator.validateScenario(
          dtrValidateResult.responseBody,
          "valid_unmapped",
        ),
      );

      // Consumer payload "DTR" is max 20 chars — keep DTR Name within that limit.
      const shortDtrName = `E2EDTR${String(Date.now()).slice(-10)}`.slice(0, 20);
      const baseDtrPayload = buildCreateDtrRequest("chain-e2e", {
        msn: dtrMeterSerial,
      });
      let dtrPayload = {
        ...baseDtrPayload,
        "DTR Name": shortDtrName,
        organisationLookupId:
          cascade.organisationLookupId ??
          dtrValidateData?.organisationLookupId ??
          baseDtrPayload.organisationLookupId,
        subStationNetworkLookupId: cascade.subStationNetworkLookupId,
        feederNetworkLookupId: cascade.feederNetworkLookupId,
        MSN: dtrMeterSerial,
      };

      const createDtrApi = new CreateDtrApi(authenticatedApi);
      let dtrResult = await createDtrApi.createDtr(dtrPayload);

      if (dtrResult.rawResponse.status() === 409) {
        console.warn(
          "[meter-dtr-consumer-e2e] create-dtr got 409 — rebuilding modem fields",
        );
        dtrPayload = {
          ...buildCreateDtrRequest("chain-e2e-retry", {
            msn: dtrMeterSerial,
          }),
          "DTR Name": shortDtrName,
          organisationLookupId: dtrPayload.organisationLookupId,
          subStationNetworkLookupId: dtrPayload.subStationNetworkLookupId,
          feederNetworkLookupId: dtrPayload.feederNetworkLookupId,
          MSN: dtrMeterSerial,
        };
        await sleep(2000);
        dtrResult = await createDtrApi.createDtr(dtrPayload);
      }
      console.log(JSON.stringify(dtrResult.responseBody, null, 2));

      const dtrMapped = CreateDtrMapper.map(dtrResult.responseBody);

      await PerformanceTracker.track(
        dtrResult.rawResponse,
        `${E2E_LABEL} — create DTR`,
        dtrResult.rawResponse.url(),
        dtrResult.responseTime,
      );

      validation.execute("Create DTR Status", () =>
        expect(dtrResult.rawResponse.status()).toBe(201),
      );
      validation.execute("Create DTR Response Time", () =>
        assert.validateResponseTime(
          dtrResult.responseTime,
          createDtrMaxResponseTimeMs,
        ),
      );
      validation.execute("Create DTR Schema", () =>
        MasterDataCommonValidator.validateZodResponseSchema(
          dtrResult.responseBody,
          CreateDtrSuccessResponseSchema,
        ),
      );
      validation.execute("Create DTR Backend Rules", () =>
        dtrValidator.validateScenario(dtrMapped, "success", dtrPayload),
      );
      expect(String(dtrMapped.data?.MSN ?? "").trim()).toBe(dtrMeterSerial);

      const createdDtrNetworkLookupId = dtrMapped.data!.networkLookupId;
      // Consumer create echoes DTR Code (not Name) when resolved via networkLookupId.
      const createdDtrCode = String(dtrMapped.data!["DTR Code"] ?? "").trim();
      const createdDtrName = String(
        dtrMapped.data!["DTR Name"] ?? shortDtrName,
      ).trim();
      const createdDtrOrgId = dtrMapped.data!.organisationLookupId;

      // ════════════════════════════════════════════════════════════════════
      // Phase 2 — Meter B → Consumer on the new DTR
      // ════════════════════════════════════════════════════════════════════
      const consumerMeterPayload = {
        ...buildCreateMeterRequest(`e2e-chain-cid-${Date.now()}`),
        meterStatus: true,
      };
      const consumerMeterSerial = consumerMeterPayload.meterSerialNumber;
      const consumerMeterResult =
        await createMeterApi.createMeter(consumerMeterPayload);
      console.log(JSON.stringify(consumerMeterResult.responseBody, null, 2));
      const consumerMeterMapped = CreateMeterMapper.map(
        consumerMeterResult.responseBody,
      );

      await PerformanceTracker.track(
        consumerMeterResult.rawResponse,
        `${E2E_LABEL} — create consumer meter`,
        consumerMeterResult.rawResponse.url(),
        consumerMeterResult.responseTime,
      );

      validation.execute("Create Consumer Meter Status", () =>
        expect(consumerMeterResult.rawResponse.status()).toBe(201),
      );
      validation.execute("Create Consumer Meter Backend Rules", () =>
        meterValidator.validateScenario(
          consumerMeterMapped,
          "success",
          consumerMeterPayload,
        ),
      );
      validation.execute("Create Consumer Meter Response Time", () =>
        assert.validateResponseTime(
          consumerMeterResult.responseTime,
          createMeterMaxResponseTimeMs,
        ),
      );

      const validateMeterApi = new ValidateMeterApi(authenticatedApi);
      const orgLookupId =
        createdDtrOrgId || createConsumerData.organisationLookupId || undefined;
      let consumerValidateResult = await validateMeterApi.validateMeter(
        consumerMeterSerial,
        orgLookupId,
      );
      let consumerValidateData = ValidateMeterMapper.mapData(
        consumerValidateResult.responseBody,
      );

      for (
        let attempt = 0;
        attempt < VALIDATE_RETRIES &&
        !(
          consumerValidateData.valid === true &&
          consumerValidateData.meterExists === true
        );
        attempt += 1
      ) {
        await sleep(VALIDATE_SETTLE_MS);
        consumerValidateResult = await validateMeterApi.validateMeter(
          consumerMeterSerial,
          orgLookupId,
        );
        consumerValidateData = ValidateMeterMapper.mapData(
          consumerValidateResult.responseBody,
        );
      }

      await PerformanceTracker.track(
        consumerValidateResult.rawResponse,
        `${E2E_LABEL} — validate consumer meter`,
        consumerValidateResult.rawResponse.url(),
        consumerValidateResult.responseTime,
      );

      validation.execute("Validate Consumer Meter Assignable", () =>
        validateMeterValidator.validateScenario(
          consumerValidateResult.responseBody,
          "assignable",
          consumerMeterSerial,
        ),
      );

      setCreateConsumerMeterContext({
        organisationLookupId: createdDtrOrgId,
        networkLookupId: createdDtrNetworkLookupId,
        meterLookupId: consumerValidateData.meterLookupId,
        zone: cascade.zone,
        subStation: cascade.subStation,
        feeder: cascade.feeder,
        dtr: createdDtrCode || createdDtrName || cascade.dtr,
      });

      const consumerPayload = buildValidCreateConsumerRequest({
        label: "chain-e2e",
        meterSerial: consumerMeterSerial,
      });
      // Pin hierarchy IDs to the DTR we just created (not cascade's existing DTR).
      consumerPayload.organisationLookupId = createdDtrOrgId;
      consumerPayload.networkLookupId = createdDtrNetworkLookupId;
      consumerPayload.subStationNetworkLookupId =
        cascade.subStationNetworkLookupId;
      consumerPayload.feederNetworkLookupId = cascade.feederNetworkLookupId;
      consumerPayload.DTR = createdDtrCode || createdDtrName;
      consumerPayload.MSN = consumerMeterSerial;

      const consumerCid = String(consumerPayload["Consumer ID"] ?? "");
      expect(String(consumerPayload.MSN ?? "")).toBe(consumerMeterSerial);

      const createConsumerApi = new CreateConsumerApi(authenticatedApi);
      let consumerResult =
        await createConsumerApi.createConsumer(consumerPayload);

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
      expect(String(consumerMapped.data?.MSN ?? "").trim()).toBe(
        consumerMeterSerial,
      );

      // ════════════════════════════════════════════════════════════════════
      // Phase 3 — Profile persistence
      // ════════════════════════════════════════════════════════════════════
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
