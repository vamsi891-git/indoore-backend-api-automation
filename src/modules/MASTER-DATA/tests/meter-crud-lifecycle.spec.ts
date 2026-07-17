import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { CreateMeterApi } from "../Api/create-meter.api";
import { UpdateMeterApi } from "../Api/update-meter.api";
import { DeactivateMeterApi } from "../Api/deactivate-meter.api";
import { buildCreateMeterRequest } from "../Data/create-meter.data";
import { toUpdateMeterPayload } from "../Data/update-meter.data";
import { CreateMeterMapper } from "../Mapper/create-meter.mapper";
import { UpdateMeterMapper } from "../Mapper/update-meter.mapper";
import { DeactivateMeterMapper } from "../Mapper/deactivate-meter.mapper";
import { CreateMeterValidator } from "../Validator/create-meter.validator";
import { UpdateMeterValidator } from "../Validator/update-meter.validator";
import { DeactivateMeterValidator } from "../Validator/deactivate-meter.validator";
import { ensureMeterManufacturerContext } from "../utils/meter-manufacturer.helper";

test.describe("Meter CRUD Lifecycle", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  test.beforeAll(async ({ authenticatedApi }) => {
    await ensureMeterManufacturerContext(authenticatedApi);
  });

  test(
    "Create meter, update and validate, then deactivate",
    {
      tag: [
        "@smoke",
        "@master-data",
        "@meter-crud",
        "@create-meter",
        "@update-meter",
        "@deactivate-meter",
      ],
    },
    async ({ authenticatedApi }) => {
      const assertion = new AssertionEngine();
      const validation = new ValidationEngine();

      const createRequest = buildCreateMeterRequest();
      const created = await new CreateMeterApi(authenticatedApi).createMeter(
        createRequest,
      );
      const createdMapped = CreateMeterMapper.map(created.responseBody);
      const createValidator = new CreateMeterValidator();

      validation.execute("Create status 201", () =>
        assertion.validateStatusCode(created.rawResponse, 201),
      );
      validation.execute("Create content type", () =>
        assertion.validateContentType(created.rawResponse),
      );
      validation.execute("Create response contract", () =>
        createValidator.validateScenario(
          createdMapped,
          "success",
          createRequest,
        ),
      );

      const meterLookupTblRefId =
        created.responseBody.data?.meterLookupTblRefId;
      expect(meterLookupTblRefId).toBeTruthy();

      const updateRequest = toUpdateMeterPayload(createRequest, {
        meterPoNumber: "PO-CRUD-UPDATED",
        meterVersion: "v2-crud",
        accuracyClass: "1",
        meterRating: "1",
        mf: 2,
        meterStatus: true,
        isActiveStatus: true,
      });
      const updated = await new UpdateMeterApi(authenticatedApi).updateMeter(
        meterLookupTblRefId!,
        updateRequest,
      );
      const updatedMapped = UpdateMeterMapper.map(updated.responseBody);
      const updateValidator = new UpdateMeterValidator();

      validation.execute("Update status 200", () =>
        assertion.validateStatusCode(updated.rawResponse, 200),
      );
      validation.execute("Update content type", () =>
        assertion.validateContentType(updated.rawResponse),
      );
      validation.execute("Update response contract and echo", () =>
        updateValidator.validateScenario(
          updatedMapped,
          "success",
          updateRequest,
          meterLookupTblRefId!,
        ),
      );
      validation.execute("Identity preserved after update", () => {
        expect(updatedMapped.data?.meterTblRefId).toBe(
          createdMapped.data?.meterTblRefId,
        );
        expect(updatedMapped.data?.meterLookupTblRefId).toBe(
          meterLookupTblRefId,
        );
        expect(updatedMapped.data?.meterSerialNumber).toBe(
          createRequest.meterSerialNumber,
        );
      });

      const deleted = await new DeactivateMeterApi(
        authenticatedApi,
      ).deactivateMeter(meterLookupTblRefId!);
      const deletedMapped = DeactivateMeterMapper.map(deleted.responseBody);
      const deactivateValidator = new DeactivateMeterValidator();

      validation.execute("Deactivate status 200", () =>
        assertion.validateStatusCode(deleted.rawResponse, 200),
      );
      validation.execute("Deactivate content type", () =>
        assertion.validateContentType(deleted.rawResponse),
      );
      validation.execute("Deactivate response contract", () =>
        deactivateValidator.validateScenario(
          deletedMapped,
          "success",
          meterLookupTblRefId!,
        ),
      );
      validation.execute("Identity preserved after deactivate", () => {
        expect(deletedMapped.data?.meterTblRefId).toBe(
          createdMapped.data?.meterTblRefId,
        );
        expect(deletedMapped.data?.meterSerialNumber).toBe(
          createRequest.meterSerialNumber,
        );
        expect(deletedMapped.data?.isActiveStatus).toBe(false);
      });

      const deletedAgain = await new DeactivateMeterApi(
        authenticatedApi,
      ).deactivateMeter(meterLookupTblRefId!);
      const deletedAgainMapped = DeactivateMeterMapper.map(
        deletedAgain.responseBody,
      );

      validation.execute("Repeated deactivate is idempotent", () => {
        expect(deletedAgain.rawResponse.status()).toBe(200);
        deactivateValidator.validateScenario(
          deletedAgainMapped,
          "already_inactive",
          meterLookupTblRefId!,
        );
      });

      validation.printSummary(
        "Meter CRUD Lifecycle — Create, Update, Deactivate",
        created.responseTime + updated.responseTime + deleted.responseTime,
      );
    },
  );
});
