import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { CreateMeterApi } from "../Api/create-meter.api";
import { CreateDtrApi } from "../Api/create-dtr.api";
import { ValidateDtrMeterApi } from "../Api/validate-dtr-meter.api";
import {
  buildCreateMeterRequest,
  createMeterMaxResponseTimeMs,
} from "../Data/create-meter.data";
import {
  buildCreateDtrRequest,
  createDtrMaxResponseTimeMs,
} from "../Data/create-dtr.data";
import { CreateMeterMapper } from "../Mapper/create-meter.mapper";
import { CreateDtrMapper } from "../Mapper/create-dtr.mapper";
import { CreateMeterValidator } from "../Validator/create-meter.validator";
import { CreateDtrValidator } from "../Validator/create-dtr.validator";
import { ValidateDtrMeterValidator } from "../Validator/validate-dtr-meter.validator";
import { MasterDataCommonValidator } from "../Validator/master-data-common.validator";
import {
  CreateDtrSuccessResponseSchema,
  CreateMeterSuccessResponseSchema,
} from "../schemas/master-data.schemas";
import { ensureMeterManufacturerContext } from "../utils/meter-manufacturer.helper";
import {
  ensureNetworkHierarchyCascadeContext,
  getNetworkHierarchyCascade,
} from "../utils/network-hierarchy-cascade.helper";

const E2E_LABEL =
  "E2E: create meter → validate dtr meter → create dtr (assign meter)";
const VALIDATE_SETTLE_MS = 1500;
const VALIDATE_RETRIES = 6;

async function sleep(ms: number): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, ms));
}

test.describe("Meter → DTR E2E", () => {
  test.describe.configure({ mode: "serial", retries: 1 });
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  test.beforeAll(async ({ authenticatedApi }) => {
    test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);
    await ensureMeterManufacturerContext(authenticatedApi);
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
        "@validate-dtr-meter",
      ],
    },
    async ({ authenticatedApi }) => {
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
      const dtrValidator = new CreateDtrValidator();

      // ── 1. Create meter ──────────────────────────────────────────────────
      const meterPayload = {
        ...buildCreateMeterRequest(`e2e-dtr-${Date.now()}`),
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

      // ── 2. Validate DTR meter (poll until assignable) ─────────────────────
      const validateDtrMeterApi = new ValidateDtrMeterApi(authenticatedApi);
      let validateResult = await validateDtrMeterApi.validateDtrMeter({
        meterSerialNumber: meterSerial,
      });
      let validateData = validateResult.responseBody.data;

      for (
        let attempt = 0;
        attempt < VALIDATE_RETRIES &&
        !(
          validateResult.responseBody.success &&
          validateData?.valid === true &&
          validateData?.meterExists === true
        );
        attempt += 1
      ) {
        await sleep(VALIDATE_SETTLE_MS);
        validateResult = await validateDtrMeterApi.validateDtrMeter({
          meterSerialNumber: meterSerial,
        });
        validateData = validateResult.responseBody.data;
      }

      await PerformanceTracker.track(
        validateResult.rawResponse,
        `${E2E_LABEL} — validate dtr meter`,
        validateResult.rawResponse.url(),
        validateResult.responseTime,
      );

      validation.execute("Validate DTR Meter Status", () =>
        expect(validateResult.rawResponse.status()).toBe(200),
      );
      validation.execute("Validate DTR Meter Assignable", () =>
        validateDtrMeterValidator.validateScenario(
          validateResult.responseBody,
          "valid_unmapped",
        ),
      );

      // ── 3. Create DTR (assigns meter via MSN) ─────────────────────────────
      const baseDtrPayload = buildCreateDtrRequest("meter-dtr-e2e", {
        msn: meterSerial,
      });
      let dtrPayload = {
        ...baseDtrPayload,
        organisationLookupId:
          cascade.organisationLookupId ??
          validateData?.organisationLookupId ??
          baseDtrPayload.organisationLookupId,
        subStationNetworkLookupId: cascade.subStationNetworkLookupId,
        feederNetworkLookupId: cascade.feederNetworkLookupId,
        MSN: meterSerial,
      };

      const createDtrApi = new CreateDtrApi(authenticatedApi);
      let dtrResult = await createDtrApi.createDtr(dtrPayload);

      // One retry on 409 — usually modem/SIM collision.
      if (dtrResult.rawResponse.status() === 409) {
        console.warn(
          "[meter-dtr-e2e] create-dtr got 409 — rebuilding unique modem fields",
        );
        dtrPayload = {
          ...buildCreateDtrRequest("meter-dtr-e2e-retry", {
            msn: meterSerial,
          }),
          organisationLookupId: dtrPayload.organisationLookupId,
          subStationNetworkLookupId: dtrPayload.subStationNetworkLookupId,
          feederNetworkLookupId: dtrPayload.feederNetworkLookupId,
          MSN: meterSerial,
        };
        await sleep(2000);
        dtrResult = await createDtrApi.createDtr(dtrPayload);
      }
      console.log(JSON.stringify(dtrResult.responseBody, null, 2));

      const dtrMapped = CreateDtrMapper.map(dtrResult.responseBody);

      await PerformanceTracker.track(
        dtrResult.rawResponse,
        `${E2E_LABEL} — create dtr`,
        dtrResult.rawResponse.url(),
        dtrResult.responseTime,
      );

      validation.execute("Create DTR Status", () =>
        expect(dtrResult.rawResponse.status()).toBe(201),
      );
      validation.execute("Create DTR Content-Type", () =>
        assert.validateContentType(dtrResult.rawResponse),
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
      expect(String(dtrMapped.data?.MSN ?? "").trim()).toBe(meterSerial);

      // ── 4. Confirm meter is now on DTR ────────────────────────────────────
      const postAssignValidate = await validateDtrMeterApi.validateDtrMeter({
        meterSerialNumber: meterSerial,
      });

      await PerformanceTracker.track(
        postAssignValidate.rawResponse,
        `${E2E_LABEL} — validate dtr meter after assign`,
        postAssignValidate.rawResponse.url(),
        postAssignValidate.responseTime,
      );

      validation.execute("Post-Assign Validate Status", () =>
        expect(postAssignValidate.rawResponse.status()).toBe(200),
      );
      validation.execute("Meter Already On DTR", () =>
        validateDtrMeterValidator.validateScenario(
          postAssignValidate.responseBody,
          "already_on_dtrs",
        ),
      );

      validation.printSummary(E2E_LABEL, dtrResult.responseTime);
    },
  );
});
