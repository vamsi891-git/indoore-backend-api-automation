import type pg from "pg";
import type { APIRequestContext } from "@playwright/test";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { ConsumerProfileApi } from "../Api/consumerprofile.api";
import { ValidateMeterApi } from "../Api/validatemeter.api";
import { ActivationApi } from "../Api/activation.api";
import {
  resolveConsumerProfileQuery,
  resolveConsumerProfileRef,
} from "../Data/consumerprofile.data";
import {
  resolveValidateConsumerMeterSerial,
  validateMeterNotInSystemSerial,
} from "../Data/validatemeter.data";
import { resolveActivationConsumerId } from "../Data/activation.data";
import { ConsumerProfileMapper } from "../Mapper/consumerprofile.mapper";
import { ValidateMeterMapper } from "../Mapper/validatemeter.mapper";
import { ActivationMapper } from "../Mapper/activation.mapper";
import {
  countConsumerAccounts,
  getConsumerActivationByRef,
  getConsumerProfileByRef,
  getMeterBySerial,
} from "../Db/consumers.db";
import {
  compareActivationStatusToDb,
  compareConsumerProfileSpotCheck,
  compareMeterSerialExists,
  compareValidateMeterToDb,
} from "../Db/consumers-db.compare";
import {
  ConsumersDbValidator,
  logConsumersDataQualityFindings,
} from "../Db/consumers-db.validator";

/**
 * Part 4 harness — profile / validate-meter / activation spot-checks.
 * Aligned with ConsumersService (not repository archive SQL).
 */
export async function runConsumersDbCoverage(
  authenticatedApi: APIRequestContext,
  db: pg.Pool,
): Promise<void> {
  const validation = new ValidationEngine();
  const profileApi = new ConsumerProfileApi(authenticatedApi);
  const meterApi = new ValidateMeterApi(authenticatedApi);
  const activationApi = new ActivationApi(authenticatedApi);

  const accountRef = resolveConsumerProfileRef("profile_found")!;
  const ivrsRef = resolveConsumerProfileRef("profile_by_ivrs")!;

  const accountBody = await profileApi.getConsumerProfile(
    accountRef,
    resolveConsumerProfileQuery("profile_found"),
  );
  const accountMapped = ConsumerProfileMapper.map(accountBody.responseBody);

  await logConsumersDataQualityFindings(
    "profile",
    accountMapped as unknown as Record<string, unknown>,
  );

  const dbByAccount = await getConsumerProfileByRef(db, accountRef);
  validation.execute("Consumer profile by Account_ID vs DB", () => {
    compareConsumerProfileSpotCheck({
      api: {
        consumerName: accountMapped.consumerName,
        consumerNumber: accountMapped.consumerNumber,
        uniqueId: accountMapped.uniqueId,
        meterSerialNumber: accountMapped.meterSerialNumber,
        ivrsNo: accountMapped.connectionDetails?.ivrsNo,
        consumerEmail: accountMapped.consumerEmail,
      },
      dbRow: dbByAccount,
      lookupKey: accountRef,
    });
  });

  if (accountMapped.meterSerialNumber?.trim()) {
    const meterRow = await getMeterBySerial(
      db,
      accountMapped.meterSerialNumber,
    );
    validation.execute("Profile meter serial exists in L_Meter_Lookup", () => {
      compareMeterSerialExists({
        apiSerial: accountMapped.meterSerialNumber,
        dbRow: meterRow,
      });
    });

    // Assigned meter from profile — ConsumersService.validateMeter → METER_ALREADY_ASSIGNED
    const assignedBody = await meterApi.validateMeter(
      accountMapped.meterSerialNumber,
    );
    const assignedData = ValidateMeterMapper.mapData(assignedBody.responseBody);
    validation.execute(
      "Validate-meter assigned serial vs DB (service-point link)",
      () => {
        compareValidateMeterToDb({
          api: {
            valid: assignedData.valid,
            meterExists: assignedData.meterExists,
            reason: assignedData.reason,
            meterSerialNumber:
              assignedData.meterSerialNumber ?? accountMapped.meterSerialNumber,
            meterLookupId: assignedData.meterLookupId,
          },
          dbRow: meterRow,
        });
      },
    );
  }

  const ivrsBody = await profileApi.getConsumerProfile(
    ivrsRef,
    resolveConsumerProfileQuery("profile_by_ivrs"),
  );
  const ivrsMapped = ConsumerProfileMapper.map(ivrsBody.responseBody);
  const dbByIvrs = await getConsumerProfileByRef(db, ivrsRef);

  validation.execute("Consumer profile by IVRS (RRNumber) vs DB", () => {
    compareConsumerProfileSpotCheck({
      api: {
        consumerName: ivrsMapped.consumerName,
        consumerNumber: ivrsMapped.consumerNumber,
        uniqueId: ivrsMapped.uniqueId,
        meterSerialNumber: ivrsMapped.meterSerialNumber,
        ivrsNo: ivrsMapped.connectionDetails?.ivrsNo,
        consumerEmail: ivrsMapped.consumerEmail,
      },
      dbRow: dbByIvrs,
      lookupKey: ivrsRef,
    });
  });

  const missingSerial =
    resolveValidateConsumerMeterSerial("meter_not_in_system") ||
    validateMeterNotInSystemSerial;
  const missingBody = await meterApi.validateMeter(missingSerial);
  const missingData = ValidateMeterMapper.mapData(missingBody.responseBody);
  const missingDb = await getMeterBySerial(db, missingSerial);
  validation.execute("Validate-meter not-in-system vs DB", () => {
    compareValidateMeterToDb({
      api: {
        valid: missingData.valid,
        meterExists: missingData.meterExists,
        reason: missingData.reason,
        meterSerialNumber: missingData.meterSerialNumber ?? missingSerial,
        meterLookupId: missingData.meterLookupId,
      },
      dbRow: missingDb,
    });
  });

  const activationCid = resolveActivationConsumerId("activate_idempotent")!;
  const activationBody = await activationApi.updateActivation(activationCid, {
    status: "active",
  });
  const activationMapped = ActivationMapper.map(activationBody.responseBody);
  const activationDb = await getConsumerActivationByRef(db, activationCid);
  validation.execute("Activation status vs M_Consumer.IsActiveStatus", () => {
    compareActivationStatusToDb({
      apiStatus: activationMapped.consumer?.status,
      dbRow: activationDb,
      lookupKey: activationCid,
    });
  });

  const dbAccountUniverse = await countConsumerAccounts(db);
  validation.execute("DB consumer account universe is non-empty", () => {
    ConsumersDbValidator.assertApiLteDb(
      "profile spot-check count",
      1,
      dbAccountUniverse,
    );
  });

  validation.printSummary("Consumers DB Coverage", 0);
}
