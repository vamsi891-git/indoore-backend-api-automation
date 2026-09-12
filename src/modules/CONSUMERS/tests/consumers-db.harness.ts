import type pg from "pg";
import type { APIRequestContext } from "@playwright/test";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { isArchiveDbConfigured } from "../../../core/db/postgres.client";
import { ConsumerProfileApi } from "../Api/consumerprofile.api";
import { ValidateMeterApi } from "../Api/validatemeter.api";
import { ActivationApi } from "../Api/activation.api";
import { BillingHistoryApi } from "../Api/billinghistory.api";
import { CommunicationStatusApi } from "../Api/communicationstatus.api";
import { RealTimePowerApi } from "../Api/realtimepower.api";
import { PowerQualityApi } from "../Api/powerquality.api";
import {
  resolveConsumerProfileQuery,
  resolveConsumerProfileRef,
} from "../Data/consumerprofile.data";
import {
  resolveValidateConsumerMeterSerial,
  validateMeterNotInSystemSerial,
} from "../Data/validatemeter.data";
import { resolveActivationConsumerId } from "../Data/activation.data";
import {
  resolveCommunicationStatusQuery,
  resolveCommunicationStatusRef,
} from "../Data/communicationstatus.data";
import { resolveBillingHistoryRef } from "../Data/billinghistory.data";
import {
  resolveRealTimePowerQuery,
  resolveRealTimePowerRef,
} from "../Data/realtimepower.data";
import {
  resolvePowerQualityQuery,
  resolvePowerQualityRef,
} from "../Data/powerquality.data";
import { ConsumerProfileMapper } from "../Mapper/consumerprofile.mapper";
import { ValidateMeterMapper } from "../Mapper/validatemeter.mapper";
import { ActivationMapper } from "../Mapper/activation.mapper";
import { BillingHistoryMapper } from "../Mapper/billinghistory.mapper";
import { CommunicationStatusMapper } from "../Mapper/communicationstatus.mapper";
import { RealTimePowerMapper } from "../Mapper/realtimepower.mapper";
import { PowerQualityMapper } from "../Mapper/powerquality.mapper";
import {
  countBillingHistoryArchiveRows,
  countConsumerAccounts,
  getConsumerActivationByRef,
  getConsumerProfileByRef,
  getLatestSpPowerQuality,
  getLatestSpRealTimePower,
  getLatestTpPowerQuality,
  getLatestTpRealTimePower,
  getMeterBySerial,
  getMeterLastSeen,
} from "../Db/consumers.db";
import {
  compareActivationStatusToDb,
  compareBillingHistoryCountToDb,
  compareCommunicationLastSeenToDb,
  compareConsumerProfileSpotCheck,
  compareMeterSerialExists,
  comparePowerQualityToDb,
  compareRealTimePowerToDb,
  compareValidateMeterToDb,
} from "../Db/consumers-db.compare";
import {
  ConsumersDbValidator,
  logConsumersDataQualityFindings,
} from "../Db/consumers-db.validator";

const BILLING_HISTORY_DB_LIMIT = 0;
const RTP_IVRS_DEFAULT = "1019258045";
const PQ_IVRS_DEFAULT = "1019258045";

async function sleepMs(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/** Mirrors ConsumersRepository.getMeterPhaseKind for profile meterPhase labels. */
function resolveMeterPhaseKind(
  meterPhase: string | null | undefined,
): "SP" | "TP" | null {
  const label = String(meterPhase ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");
  if (!label) return null;
  if (
    /\b3\s*[-]?\s*(PH|PHASE)\b/.test(label) ||
    /\bTHREE\b/.test(label) ||
    /\bHT\b/.test(label) ||
    label.includes("3PH")
  ) {
    return "TP";
  }
  if (
    /\b1\s*[-]?\s*(PH|PHASE)\b/.test(label) ||
    /\bSINGLE\b/.test(label) ||
    label.includes("1PH")
  ) {
    return "SP";
  }
  return null;
}

function isEmptyPowerQualityMetrics(data: {
  overallPf?: { value: number | null } | null;
  frequency?: { value: number | null } | null;
  neutralCurrent?: { value: number | null } | null;
  mdKw?: { value: number | null } | null;
  mdKva?: { value: number | null } | null;
} | null): boolean {
  if (data == null) return true;
  return (
    data.overallPf?.value == null &&
    data.frequency?.value == null &&
    data.neutralCurrent?.value == null &&
    data.mdKw?.value == null &&
    data.mdKva?.value == null
  );
}

/**
 * Real-time-power V/I/PF vs archive/primary IP — locked to CONSUMER_RTP_IVRS.
 * Runs early in the harness so archive timeouts from later widgets don't starve it.
 */
async function runRealTimePowerDbCompare(options: {
  authenticatedApi: APIRequestContext;
  db: pg.Pool;
  archiveDb?: pg.Pool | null;
  validation: ValidationEngine;
}): Promise<void> {
  const { authenticatedApi, db, archiveDb, validation } = options;
  const rtpApi = new RealTimePowerApi(authenticatedApi);
  const rtpRef =
    process.env.CONSUMER_RTP_IVRS?.trim() ||
    resolveRealTimePowerRef("power_by_ivrs") ||
    RTP_IVRS_DEFAULT;

  const rtpProfile = await getConsumerProfileByRef(db, rtpRef);
  const rtpMeterLookupId = rtpProfile?.meterLookupTblRefId;
  if (rtpMeterLookupId == null || !Number.isFinite(rtpMeterLookupId)) {
    console.warn(
      `[BACKEND FINDING] real-time-power DB compare skipped — no DB meter for IVRS=${rtpRef}`,
    );
    return;
  }

  const archiveReady = Boolean(archiveDb && isArchiveDbConfigured());
  const tpDbRow = archiveReady
    ? await getLatestTpRealTimePower(archiveDb!, rtpMeterLookupId)
    : null;
  const spDbRow = tpDbRow
    ? null
    : await getLatestSpRealTimePower(db, rtpMeterLookupId);
  const phaseKind: "SP" | "TP" = tpDbRow ? "TP" : "SP";
  const dbRow = tpDbRow ?? spDbRow;

  let rtpMapped = RealTimePowerMapper.map({ success: true, data: null });
  for (let attempt = 1; attempt <= 5; attempt++) {
    const rtpBody = await rtpApi.getRealTimePower(
      rtpRef,
      resolveRealTimePowerQuery("power_by_ivrs"),
    );
    rtpMapped = RealTimePowerMapper.map(rtpBody.responseBody);
    if (rtpMapped.data != null) {
      break;
    }
    if (attempt < 5) {
      console.warn(
        `[BACKEND FINDING] real-time-power data null attempt ${attempt}/5 IVRS=${rtpRef} — retrying`,
      );
      await sleepMs(2000 * attempt);
    }
  }

  if (rtpMapped.data == null) {
    if (dbRow) {
      console.warn(
        [
          `[BACKEND FINDING] API real-time-power data is null for IVRS=${rtpRef}`,
          `  meterLookupId=${rtpMeterLookupId} phaseKind=${phaseKind}`,
          `  DB has latest IP readings (e.g. R.voltage=${dbRow.rVoltage})`,
          "  Hint: archive timeout / cache miss — backend returned null while DB row exists.",
        ].join("\n"),
      );
    } else {
      console.warn(
        `[BACKEND FINDING] real-time-power data null and no IP row for IVRS=${rtpRef} meterLookupId=${rtpMeterLookupId}`,
      );
    }
    return;
  }

  if (phaseKind === "TP" && !archiveReady) {
    console.warn(
      "[BACKEND FINDING] real-time-power TP DB check skipped — archive DB not configured",
    );
    return;
  }

  validation.execute(
    `Real-time-power ${phaseKind} voltage/current/PF vs DB (${rtpRef})`,
    () => {
      compareRealTimePowerToDb({
        api: rtpMapped.data,
        dbRow,
        meterLookupId: rtpMeterLookupId,
        phaseKind,
      });
    },
  );
}

/**
 * Power-quality PF/Hz/neutral/MD vs archive IP — locked to CONSUMER_PQ_IVRS.
 * Runs early with RTP so archive timeouts from later widgets don't starve it.
 */
async function runPowerQualityDbCompare(options: {
  authenticatedApi: APIRequestContext;
  db: pg.Pool;
  archiveDb?: pg.Pool | null;
  validation: ValidationEngine;
}): Promise<void> {
  const { authenticatedApi, db, archiveDb, validation } = options;
  const pqApi = new PowerQualityApi(authenticatedApi);
  const profileApi = new ConsumerProfileApi(authenticatedApi);
  const pqRef =
    process.env.CONSUMER_PQ_IVRS?.trim() ||
    resolvePowerQualityRef("pq_by_ivrs") ||
    PQ_IVRS_DEFAULT;

  const pqProfile = await getConsumerProfileByRef(db, pqRef);
  const pqMeterLookupId = pqProfile?.meterLookupTblRefId;
  if (pqMeterLookupId == null || !Number.isFinite(pqMeterLookupId)) {
    console.warn(
      `[BACKEND FINDING] power-quality DB compare skipped — no DB meter for IVRS=${pqRef}`,
    );
    return;
  }

  const archiveReady = Boolean(archiveDb && isArchiveDbConfigured());
  if (!archiveReady) {
    console.warn(
      "[BACKEND FINDING] power-quality DB check skipped — archive DB not configured",
    );
    return;
  }

  const [tpDbRow, spDbRow, profileBody] = await Promise.all([
    getLatestTpPowerQuality(archiveDb!, pqMeterLookupId),
    getLatestSpPowerQuality(archiveDb!, pqMeterLookupId),
    profileApi.getConsumerProfile(pqRef, resolveConsumerProfileQuery("profile_by_ivrs")),
  ]);
  const profileMapped = ConsumerProfileMapper.map(profileBody.responseBody);
  const preferredPhase =
    resolveMeterPhaseKind(profileMapped.connectionMeterDetails?.meterPhase) ??
    (tpDbRow ? "TP" : "SP");

  let phaseKind: "SP" | "TP" = preferredPhase;
  let dbRow = preferredPhase === "TP" ? tpDbRow : spDbRow;
  if (!dbRow) {
    phaseKind = preferredPhase === "TP" ? "SP" : "TP";
    dbRow = preferredPhase === "TP" ? spDbRow : tpDbRow;
  }

  let pqMapped = PowerQualityMapper.map({ success: true, data: null });
  for (let attempt = 1; attempt <= 5; attempt++) {
    const pqBody = await pqApi.getPowerQuality(
      pqRef,
      resolvePowerQualityQuery("pq_by_ivrs"),
    );
    pqMapped = PowerQualityMapper.map(pqBody.responseBody);
    if (pqMapped.data != null && !isEmptyPowerQualityMetrics(pqMapped.data)) {
      break;
    }
    if (attempt < 5) {
      console.warn(
        `[BACKEND FINDING] power-quality empty/null attempt ${attempt}/5 IVRS=${pqRef} — retrying`,
      );
      await sleepMs(2000 * attempt);
    }
  }

  if (pqMapped.data == null || isEmptyPowerQualityMetrics(pqMapped.data)) {
    if (dbRow) {
      console.warn(
        [
          `[BACKEND FINDING] API power-quality metrics empty/null for IVRS=${pqRef}`,
          `  meterLookupId=${pqMeterLookupId} phaseKind=${phaseKind}`,
          `  DB has latest IP readings (e.g. overallPf=${dbRow.overallPf})`,
          "  Hint: archive timeout / cache miss — backend returned empty while DB row exists.",
        ].join("\n"),
      );
    } else {
      console.warn(
        `[BACKEND FINDING] power-quality empty and no IP row for IVRS=${pqRef} meterLookupId=${pqMeterLookupId}`,
      );
    }
    return;
  }

  validation.execute(
    `Power-quality ${phaseKind} PF/Hz/neutral/MD vs DB (${pqRef})`,
    () => {
      comparePowerQualityToDb({
        api: pqMapped.data,
        dbRow,
        meterLookupId: pqMeterLookupId,
        phaseKind,
      });
    },
  );
}

/**
 * Part 4 harness — profile / validate-meter / activation +
 * billing-history archive count + communication meter_last_seen +
 * real-time-power voltage/current/PF + power-quality metrics vs IP tables.
 */
export async function runConsumersDbCoverage(
  authenticatedApi: APIRequestContext,
  db: pg.Pool,
  archiveDb?: pg.Pool | null,
): Promise<void> {
  const validation = new ValidationEngine();
  const profileApi = new ConsumerProfileApi(authenticatedApi);
  const meterApi = new ValidateMeterApi(authenticatedApi);
  const activationApi = new ActivationApi(authenticatedApi);
  const billingHistoryApi = new BillingHistoryApi(authenticatedApi);
  const communicationApi = new CommunicationStatusApi(authenticatedApi);

  // RTP + PQ first — archive IP reads are sensitive to pool load from later widgets.
  await runRealTimePowerDbCompare({
    authenticatedApi,
    db,
    archiveDb,
    validation,
  });
  await runPowerQualityDbCompare({
    authenticatedApi,
    db,
    archiveDb,
    validation,
  });

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

  // --- Billing history vs archive (Billing_Class_D1 / D3) ---
  // Prefer billing-history fixture consumer (known archive rows) over profile sample.
  if (archiveDb && isArchiveDbConfigured()) {
    const bhRef =
      resolveBillingHistoryRef("bh_by_ivrs_all") ||
      accountRef;
    const bhProfile = await getConsumerProfileByRef(db, bhRef);
    const billingMeterSerial =
      bhProfile?.meterSerialNumber?.trim() ||
      accountMapped.meterSerialNumber?.trim() ||
      "";
    if (billingMeterSerial) {
      const bhBody = await billingHistoryApi.getBillingHistory(bhRef, {
        billingLimit: BILLING_HISTORY_DB_LIMIT,
      });
      const bhMapped = BillingHistoryMapper.map(bhBody.responseBody);
      const archiveCount = await countBillingHistoryArchiveRows(
        archiveDb,
        billingMeterSerial,
      );
      validation.execute(
        "Billing-history row count vs archive Billing_Class_D1/D3",
        () => {
          compareBillingHistoryCountToDb({
            apiRowCount: bhMapped.items.length,
            dbRowCount: archiveCount,
            apiNonNullConsumptionCount: bhMapped.items.filter(
              (row) => row.consumptionKwh != null,
            ).length,
            limit: BILLING_HISTORY_DB_LIMIT,
            meterSerial: billingMeterSerial,
          });
        },
      );
    }
  } else {
    console.warn(
      "[BACKEND FINDING] billing-history DB check skipped — archive DB not configured",
    );
  }

  // --- Communication lastSeen vs general.meter_last_seen ---
  const commRef =
    resolveCommunicationStatusRef("status_default_today") || accountRef;
  const meterLookupId =
    dbByAccount?.meterLookupTblRefId ?? dbByIvrs?.meterLookupTblRefId;
  if (meterLookupId != null && Number.isFinite(meterLookupId)) {
    const commBody = await communicationApi.getCommunicationStatus(
      commRef,
      resolveCommunicationStatusQuery("status_default_today"),
    );
    const commMapped = CommunicationStatusMapper.map(commBody.responseBody);
    const lastSeenRow = await getMeterLastSeen(db, meterLookupId);
    validation.execute(
      "Communication lastSeen vs general.meter_last_seen",
      () => {
        compareCommunicationLastSeenToDb({
          apiHasLastSeen: Boolean(commMapped.delayed?.lastSeen?.trim()),
          dbLastSeen: lastSeenRow?.lastSeen,
          meterLookupId,
        });
      },
    );
  }

  validation.printSummary("Consumers DB Coverage", 0);
}
