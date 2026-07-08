import type { APIRequestContext } from "@playwright/test";
import { ConsumerCategoryApi } from "../../UTILS-LOOKUP/Api/consumercategory.api";
import { ConnectionStatusApi } from "../../UTILS-LOOKUP/Api/connectionstatus.api";
import { MeterPhaseApi } from "../../UTILS-LOOKUP/Api/meterphase.api";
import { PaymentContractApi } from "../../UTILS-LOOKUP/Api/paymentcontract.api";
import { ConsumerCategoryMapper } from "../../UTILS-LOOKUP/Mapper/consumercategory.mapper";
import { ConnectionStatusMapper } from "../../UTILS-LOOKUP/Mapper/connectionstatus.mapper";
import { MeterPhaseMapper } from "../../UTILS-LOOKUP/Mapper/meterphase.mapper";
import { PaymentContractMapper } from "../../UTILS-LOOKUP/Mapper/paymentcontract.mapper";
import {
  resolveMasterDataEnv,
  resolveMasterDataEnvInt,
} from "./master-data-env.helper";

/**
 * =============================================================================
 * BACKEND ISSUES — Consumer lookup resolution (UTILS-LOOKUP + consumer APIs)
 * Full manual registry: src/Manual Testing/Bulk upload validations.txt
 * Probe evidence: reports/probe-hierarchy.txt (2026-07-07)
 * =============================================================================
 *
 * -----------------------------------------------------------------------------
 * ISSUE 1 — Missing UTILS-LOOKUP APIs (Billing Cycle, TOD, Main/Sub Meter)
 * -----------------------------------------------------------------------------
 * Consumer Bulk §2 requires valid Billing Cycle, TOD, Main/Sub Meter.
 * Only four lookup APIs exist and are called below. Probed alternatives 404:
 *
 *   GET /indore/utils/billing-cycles  → 404 Cannot GET /utils/billing-cycles
 *   GET /indore/utils/tod             → 404 Cannot GET /utils/tod
 *   GET /indore/utils/main-sub-meter    → 404 Cannot GET /utils/main-sub-meter
 *
 * Working lookups (HTTP 200 JSON):
 *   consumer-categories, connection-statuses, meter-phases, payment-contracts
 *
 * Impact: billingCycleId, todId, mainSubMeterId are taken from
 *         CREATE_CONSUMER_*_TBL_REF_ID env defaults (master-data-env.helper.ts),
 *         not validated against a live dropdown API.
 *
 * -----------------------------------------------------------------------------
 * ISSUE 2 — "Connection Type" served by payment-contracts (naming mismatch)
 * -----------------------------------------------------------------------------
 * Manual field: Connection Type (Prepaid/Postpaid)
 * API route:     GET /indore/utils/payment-contracts
 * Missing:       GET /indore/utils/connection-types → 404
 *
 * Proof (payment-contracts HTTP 200):
 *   { "items": [ { "id": 1, "name": "Prepaid" }, { "id": 2, "name": "Postpaid" } ] }
 *
 * -----------------------------------------------------------------------------
 * ISSUE 3 — BLOCKER: bulk-upload-consumers ignores Excel hierarchy text
 * -----------------------------------------------------------------------------
 * Endpoint: POST /indore/master-data/bulk-upload-consumers
 * Manual:   Zone / Sub Station / Feeder / DTR text must resolve to network ids
 *           (same as DTR bulk-upload and POST /indore/consumers).
 *
 * Proof (valid Excel row, Hawabangla / PragatiNagar / PARMANU NAGAR(CHQ) / RJ662):
 *   HTTP 400
 *   {
 *     "success": false,
 *     "message": "No consumers were created. Review validation and row errors.",
 *     "data": {
 *       "createdCount": 0,
 *       "validationFailedCount": 1,
 *       "rowResults": [{
 *         "status": "VALIDATION_FAILED",
 *         "message": "subStationNetworkLookupId is required feederNetworkLookupId is required",
 *         "messages": [
 *           "subStationNetworkLookupId is required",
 *           "feederNetworkLookupId is required"
 *         ]
 *       }]
 *     }
 *   }
 *
 * Compare: POST /indore/consumers succeeds because payload sends
 *          subStationNetworkLookupId + feederNetworkLookupId explicitly.
 * Tag: @backend-defect on bulk_success, bulk_success_multi, bulk_success_blank_row
 *
 * -----------------------------------------------------------------------------
 * ISSUE 4 — Field rules blocked behind hierarchy error (bulk consumers)
 * -----------------------------------------------------------------------------
 * While ISSUE 3 exists, these scenarios never reach field validation:
 *   row_invalid_nearest_acct_id, row_meter_not_found, row_meter_inactive,
 *   row_meter_already_mapped
 * Row error is always hierarchy lookup id message (proof above), not the
 * intended nearest-account or meter message.
 *
 * -----------------------------------------------------------------------------
 * ISSUE 5 — Bulk accepts invalid meter / IMEI when hierarchy is fixed (expected)
 * -----------------------------------------------------------------------------
 * row_meter_not_found (MSN = Z{random}): Expected HTTP 400; API returns 200 CREATED
 * row_invalid_imei (Modem IMEI = "12345"): Expected HTTP 400; API returns 200 CREATED
 * See Bulk upload validations.txt §BULK UPLOAD CONSUMERS DEFECTS.
 *
 * -----------------------------------------------------------------------------
 * ISSUE 6 — CREATE DTR accepts invalid payloads (uses same lookup ids)
 * -----------------------------------------------------------------------------
 * POST /indore/master-data/add-dtr returns HTTP 201 for:
 *   DTR Capacity = 0, non-existent MSN, invalid Main/Sub Meter / Meter Phase ids,
 *   IMEI "12345", reading = 0
 * Future Service/Installation dates are correctly rejected (HTTP 400).
 * See Bulk upload validations.txt §CREATE DTR DEFECTS.
 *
 * -----------------------------------------------------------------------------
 * ISSUE 7 — BULK UPLOAD DTR inactive meter wrong error text
 * -----------------------------------------------------------------------------
 * POST /indore/master-data/bulk-upload-dtr, inactive MSN 7060268:
 *   Expected row error: meter inactive / must be active
 *   Actual row message: "meter not found or not in your access scope"
 *   Note: validate-dtr-meter API returns METER_INACTIVE for same serial.
 * Tag: @backend-defect row_meter_inactive
 */

/** Fixed dropdown labels — Consumer Bulk §2–§3 + UTILS-LOOKUP validators. */
export const CONSUMER_CATEGORY_DROPDOWN_VALUES = [
  "Residential",
  "Commercial",
  "Agriculture",
] as const;

export const CONNECTION_STATUS_DROPDOWN_VALUES = [
  "Connected",
  "Disconnected",
  "Permanent Disconnection",
] as const;

export const METER_PHASE_DROPDOWN_VALUES = ["1 PH", "3PH WC", "HT"] as const;

export const PAYMENT_CONTRACT_DROPDOWN_VALUES = ["Prepaid", "Postpaid"] as const;

export interface ConsumerLookupIds {
  consumerCategoryId: number;
  connectionStatusId: number;
  meterPhaseId: number;
  connectionTypeId: number;
  billingCycleId: number;
  todId: number;
  mainSubMeterId: number;
}

export interface ConsumerLookupLabels {
  consumerCategory: string;
  connectionStatus: string;
  meterPhase: string;
  connectionType: string;
  billingCycle: string;
  tod: string;
  mainSubMeter: string;
}

let resolvedIds: ConsumerLookupIds | null = null;
let resolvedLabels: ConsumerLookupLabels | null = null;
let ensurePromise: Promise<void> | null = null;

function staticConsumerCategoryName(): string {
  return resolveMasterDataEnv("BULK_CONSUMER_CATEGORY_NAME") || "Commercial";
}

function staticConnectionStatusName(): string {
  return resolveMasterDataEnv("BULK_CONSUMER_CONNECTION_STATUS_NAME") || "Connected";
}

function staticMeterPhaseName(): string {
  return resolveMasterDataEnv("BULK_DTR_METER_PHASE") || "1 PH";
}

function staticConnectionTypeName(): string {
  return resolveMasterDataEnv("BULK_CONSUMER_CONNECTION_TYPE_NAME") || "Prepaid";
}

function staticBillingCycleName(): string {
  return resolveMasterDataEnv("BULK_CONSUMER_BILLING_CYCLE_NAME") || "Monthly";
}

function staticTodName(): string {
  const fromEnv = resolveMasterDataEnv("BULK_CONSUMER_TOD_NAME");
  if (fromEnv && !/^\d+$/.test(fromEnv.trim())) {
    return fromEnv;
  }
  const id = resolveMasterDataEnvInt("CREATE_CONSUMER_TOD_TBL_REF_ID", 0) || 1;
  return TOD_ID_BULK_LABELS[id] ?? fromEnv ?? "NO TOD LT";
}

/** Bulk Excel TOD labels keyed by tbl ref id (POST /indore/consumers uses ids). */
const TOD_ID_BULK_LABELS: Record<number, string> = {
  1: "NO TOD LT",
};

function staticMainSubMeterName(): string {
  return resolveMasterDataEnv("BULK_DTR_MAIN_SUB_METER") || "Main";
}

function findByName<T extends { id: number; name: string }>(
  items: T[],
  targetName: string,
  field: string,
): T {
  const match = items.find((item) => item.name.trim() === targetName.trim());
  if (!match) {
    const available = items.map((item) => item.name).join(", ");
    throw new Error(
      `${field} "${targetName}" not found in dropdown. Available: ${available}`,
    );
  }
  return match;
}

function envOverrideIds(): Partial<ConsumerLookupIds> {
  return {
    consumerCategoryId: resolveMasterDataEnvInt(
      "CREATE_CONSUMER_CATEGORY_TBL_REF_ID",
      0,
    ),
    connectionStatusId: resolveMasterDataEnvInt(
      "CREATE_CONSUMER_CONNECTION_STATUS_TBL_REF_ID",
      0,
    ),
    meterPhaseId: resolveMasterDataEnvInt("CREATE_CONSUMER_METER_PHASE_TBL_REF_ID", 0),
    connectionTypeId: resolveMasterDataEnvInt(
      "CREATE_CONSUMER_CONNECTION_TYPE_TBL_REF_ID",
      0,
    ),
    billingCycleId: resolveMasterDataEnvInt(
      "CREATE_CONSUMER_BILLING_CYCLE_TBL_REF_ID",
      0,
    ),
    todId: resolveMasterDataEnvInt("CREATE_CONSUMER_TOD_TBL_REF_ID", 0),
    mainSubMeterId: resolveMasterDataEnvInt(
      "CREATE_CONSUMER_MAIN_SUB_METER_TBL_REF_ID",
      0,
    ),
  };
}

export function getConsumerLookupIds(): ConsumerLookupIds {
  if (resolvedIds) {
    return resolvedIds;
  }
  const overrides = envOverrideIds();
  return {
    consumerCategoryId: overrides.consumerCategoryId || 3,
    connectionStatusId: overrides.connectionStatusId || 1,
    meterPhaseId: overrides.meterPhaseId || 1,
    connectionTypeId: overrides.connectionTypeId || 1,
    billingCycleId: overrides.billingCycleId || 1,
    todId: overrides.todId || 1,
    mainSubMeterId: overrides.mainSubMeterId || 1,
  };
}

export function getConsumerLookupLabels(): ConsumerLookupLabels {
  if (resolvedLabels) {
    return resolvedLabels;
  }
  return {
    consumerCategory: staticConsumerCategoryName(),
    connectionStatus: staticConnectionStatusName(),
    meterPhase: staticMeterPhaseName(),
    connectionType: staticConnectionTypeName(),
    billingCycle: staticBillingCycleName(),
    tod: staticTodName(),
    mainSubMeter: staticMainSubMeterName(),
  };
}

/** Bulk Excel rows use dropdown display labels (not numeric tbl ref ids). */
export function getConsumerCategoryBulkValue(): string {
  return getConsumerLookupLabels().consumerCategory;
}

export function getConnectionStatusBulkValue(): string {
  return getConsumerLookupLabels().connectionStatus;
}

export function getMeterPhaseBulkValue(): string {
  return getConsumerLookupLabels().meterPhase;
}

export function getConnectionTypeBulkValue(): string {
  return getConsumerLookupLabels().connectionType;
}

export function getBillingCycleBulkValue(): string {
  return getConsumerLookupLabels().billingCycle;
}

export function getTodBulkValue(): string {
  return getConsumerLookupLabels().tod;
}

export function getMainSubMeterBulkValue(): string {
  return getConsumerLookupLabels().mainSubMeter;
}

export function getConsumerCategoryId(): number {
  return getConsumerLookupIds().consumerCategoryId;
}

export function getConnectionStatusId(): number {
  return getConsumerLookupIds().connectionStatusId;
}

export function getMeterPhaseId(): number {
  return getConsumerLookupIds().meterPhaseId;
}

export function getConnectionTypeId(): number {
  return getConsumerLookupIds().connectionTypeId;
}

export function getBillingCycleId(): number {
  return getConsumerLookupIds().billingCycleId;
}

export function getTodId(): number {
  return getConsumerLookupIds().todId;
}

export function getMainSubMeterId(): number {
  return getConsumerLookupIds().mainSubMeterId;
}

/**
 * Resolves consumer dropdown ids/names from UTILS-LOOKUP APIs (Consumer Bulk §2–§3).
 * Bulk upload uses labels; POST /indore/consumers uses numeric lookup ids.
 */
export async function ensureConsumerLookupContext(
  authenticatedApi: APIRequestContext,
): Promise<void> {
  if (ensurePromise) {
    await ensurePromise;
    return;
  }

  ensurePromise = (async () => {
    const overrides = envOverrideIds();
    const labels: ConsumerLookupLabels = {
      consumerCategory: staticConsumerCategoryName(),
      connectionStatus: staticConnectionStatusName(),
      meterPhase: staticMeterPhaseName(),
      connectionType: staticConnectionTypeName(),
      billingCycle: staticBillingCycleName(),
      tod: staticTodName(),
      mainSubMeter: staticMainSubMeterName(),
    };

    const hasLookupOverrides =
      (overrides.consumerCategoryId ?? 0) > 0 &&
      (overrides.connectionStatusId ?? 0) > 0 &&
      (overrides.meterPhaseId ?? 0) > 0 &&
      (overrides.connectionTypeId ?? 0) > 0;

    if (hasLookupOverrides) {
      resolvedIds = {
        consumerCategoryId: overrides.consumerCategoryId || 3,
        connectionStatusId: overrides.connectionStatusId || 1,
        meterPhaseId: overrides.meterPhaseId || 1,
        connectionTypeId: overrides.connectionTypeId || 1,
        billingCycleId: overrides.billingCycleId || 1,
        todId: overrides.todId || 1,
        mainSubMeterId: overrides.mainSubMeterId || 1,
      };
      resolvedLabels = labels;
      console.log(
        `[consumer-lookup] using env lookup ids category=${resolvedIds.consumerCategoryId} status=${resolvedIds.connectionStatusId} phase=${resolvedIds.meterPhaseId} connectionType=${resolvedIds.connectionTypeId}`,
      );
      return;
    }

    const categoryApi = new ConsumerCategoryApi(authenticatedApi);
    const statusApi = new ConnectionStatusApi(authenticatedApi);
    const phaseApi = new MeterPhaseApi(authenticatedApi);
    const paymentApi = new PaymentContractApi(authenticatedApi);

    let categoryRes;
    let statusRes;
    let phaseRes;
    let paymentRes;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      [categoryRes, statusRes, phaseRes, paymentRes] = await Promise.all([
        categoryApi.getConsumerCategories(),
        statusApi.getConnectionStatuses(),
        phaseApi.getMeterPhases(),
        paymentApi.getPaymentContracts(),
      ]);
      const statuses = [
        categoryRes.rawResponse.status(),
        statusRes.rawResponse.status(),
        phaseRes.rawResponse.status(),
        paymentRes.rawResponse.status(),
      ];
      if (statuses.some((code) => code === 429 || code === 503)) {
        await new Promise((resolve) => setTimeout(resolve, 3000 * (attempt + 1)));
        continue;
      }
      break;
    }

    if (!categoryRes || !statusRes || !phaseRes || !paymentRes) {
      throw new Error("consumer lookup APIs returned no response");
    }

    for (const [name, res] of [
      ["consumer-categories", categoryRes],
      ["connection-statuses", statusRes],
      ["meter-phases", phaseRes],
      ["payment-contracts", paymentRes],
    ] as const) {
      if (res.rawResponse.status() !== 200 || !res.responseBody.success) {
        throw new Error(
          `${name} lookup failed (status ${res.rawResponse.status()})`,
        );
      }
    }

    const categories = ConsumerCategoryMapper.mapData(categoryRes.responseBody.data);
    const statuses = ConnectionStatusMapper.mapData(statusRes.responseBody.data);
    const phases = MeterPhaseMapper.mapData(phaseRes.responseBody.data);
    const payments = PaymentContractMapper.mapData(paymentRes.responseBody.data);

    const category = findByName(
      categories.items,
      labels.consumerCategory,
      "Consumer Category",
    );
    const status = findByName(
      statuses.items,
      labels.connectionStatus,
      "Connection Status",
    );
    const phase = findByName(phases.items, labels.meterPhase, "Meter Phase");
    const connectionType = findByName(
      payments.items,
      labels.connectionType,
      "Connection Type",
    );

    const billingCycleId = overrides.billingCycleId || 1;
    const todId = overrides.todId || 1;
    const mainSubMeterId = overrides.mainSubMeterId || 1;

    resolvedIds = {
      consumerCategoryId: overrides.consumerCategoryId || category.id,
      connectionStatusId: overrides.connectionStatusId || status.id,
      meterPhaseId: overrides.meterPhaseId || phase.id,
      connectionTypeId: overrides.connectionTypeId || connectionType.id,
      billingCycleId,
      todId: Number.isFinite(todId) && todId > 0 ? todId : 1,
      mainSubMeterId,
    };
    resolvedLabels = labels;

    console.log(
      `[consumer-lookup] category="${labels.consumerCategory}"(${resolvedIds.consumerCategoryId}) status="${labels.connectionStatus}"(${resolvedIds.connectionStatusId}) phase="${labels.meterPhase}"(${resolvedIds.meterPhaseId}) connectionType="${labels.connectionType}"(${resolvedIds.connectionTypeId}) billing="${labels.billingCycle}"(${resolvedIds.billingCycleId}) tod="${labels.tod}"(${resolvedIds.todId}) mainSub="${labels.mainSubMeter}"(${resolvedIds.mainSubMeterId})`,
    );
  })().catch((err) => {
    ensurePromise = null;
    throw err;
  });

  await ensurePromise;
}
