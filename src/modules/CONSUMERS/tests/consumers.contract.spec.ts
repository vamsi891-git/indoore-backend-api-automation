/**
 * CONSUMERS contract snapshots — structural only (UTILS-LOOKUP style).
 * Do NOT snapshot live kWh / voltage / timestamps — those drift every run.
 *
 * First run / intentional shape change:
 *   UPDATE_CONTRACT_SNAPSHOTS=true npm run test:consumers:contract
 */
import { test, expect } from "../../../fixtures/observability.fixture";
import {
  assertContractSnapshot,
  buildLookupItemsContractSnapshot,
} from "../../../core/contract/contract-snapshot.helper";

import { ConsumerProfileApi } from "../Api/consumerprofile.api";
import { CommunicationStatusApi } from "../Api/communicationstatus.api";
import { BillingHistoryApi } from "../Api/billinghistory.api";
import { BillingPeriodApi } from "../Api/billingperiod.api";
import { EnergyConsumptionGraphApi } from "../Api/energyconsumptiongraph.api";
import { EnergyFlowApi } from "../Api/energyflow.api";
import { EventLogCardsApi } from "../Api/eventlogcards.api";
import { EventLogListApi } from "../Api/eventloglist.api";
import { LiveLoadProfileApi } from "../Api/liveloadprofile.api";
import { PowerQualityApi } from "../Api/powerquality.api";
import { RealTimePowerApi } from "../Api/realtimepower.api";
import { ValidateMeterApi } from "../Api/validatemeter.api";
import { NearestAccountIdsApi } from "../Api/nearestaccountids.api";
import { ActivationApi } from "../Api/activation.api";

import {
  resolveConsumerProfileQuery,
  resolveConsumerProfileRef,
} from "../Data/consumerprofile.data";
import {
  resolveCommunicationStatusQuery,
  resolveCommunicationStatusRef,
} from "../Data/communicationstatus.data";
import {
  resolveBillingHistoryQuery,
  resolveBillingHistoryRef,
} from "../Data/billinghistory.data";
import { billingPeriodData } from "../Data/billingperiod.data";
import {
  resolveEnergyConsumptionGraphQuery,
  resolveEnergyConsumptionGraphRef,
} from "../Data/energyconsumptiongraph.data";
import {
  resolveEnergyFlowQuery,
  resolveEnergyFlowRef,
} from "../Data/energyflow.data";
import {
  resolveEventLogCardsQuery,
  resolveEventLogCardsRef,
} from "../Data/eventlogcards.data";
import {
  resolveEventLogListQuery,
  resolveEventLogListRef,
} from "../Data/eventloglist.data";
import {
  resolveLiveLoadProfileQuery,
  resolveLiveLoadProfileRef,
} from "../Data/liveloadprofile.data";
import {
  resolvePowerQualityQuery,
  resolvePowerQualityRef,
} from "../Data/powerquality.data";
import {
  resolveRealTimePowerQuery,
  resolveRealTimePowerRef,
} from "../Data/realtimepower.data";
import { resolveValidateConsumerMeterSerial } from "../Data/validatemeter.data";
import { resolveNearestAccountIdsQuery } from "../Data/nearestaccountids.data";
import { resolveActivationConsumerId } from "../Data/activation.data";

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function buildConsumersStructuralSnapshot(
  pathPattern: string,
  responseBody: unknown,
) {
  const body = asRecord(responseBody);
  const data = body.data;
  const dataRecord = asRecord(data);

  // Real-time power: data is often null offline; lock the populated phase shape
  // so snapshots do not flip between null and live readings.
  if (pathPattern.includes("real-time-power")) {
    if (data != null && typeof data === "object" && !Array.isArray(data)) {
      for (const phase of ["R-Phase", "Y-Phase", "B-Phase"]) {
        expect(dataRecord).toHaveProperty(phase);
      }
    }
    return buildLookupItemsContractSnapshot({
      pathPattern,
      dataKeys: ["B-Phase", "R-Phase", "Y-Phase"],
      itemKeys: [
        "current",
        "currentUnit",
        "powerFactor",
        "powerFactorUnit",
        "voltage",
        "voltageUnit",
      ],
    });
  }

  const dataKeys = Array.isArray(data)
    ? ["(array)"]
    : data == null
      ? ["(null)"]
      : Object.keys(dataRecord);

  let itemKeys: string[] = [];
  if (Array.isArray(data) && data.length > 0) {
    itemKeys = Object.keys(asRecord(data[0]));
  } else if (Array.isArray(dataRecord.points) && dataRecord.points.length > 0) {
    itemKeys = Object.keys(asRecord(dataRecord.points[0]));
  } else if (Array.isArray(dataRecord.rows) && dataRecord.rows.length > 0) {
    itemKeys = Object.keys(asRecord(dataRecord.rows[0]));
  } else if (
    Array.isArray(dataRecord.nearestAccountIds) &&
    dataRecord.nearestAccountIds.length > 0
  ) {
    itemKeys = Object.keys(asRecord(dataRecord.nearestAccountIds[0]));
  } else if (dataRecord.consumer && typeof dataRecord.consumer === "object") {
    itemKeys = Object.keys(asRecord(dataRecord.consumer));
  } else if (data != null && !Array.isArray(data)) {
    // Object envelope (profile, cards, metrics) — lock top-level data keys only
    itemKeys = dataKeys;
  }

  return buildLookupItemsContractSnapshot({
    pathPattern,
    dataKeys,
    itemKeys,
  });
}

async function snapshotEndpoint(
  snapshotName: string,
  pathPattern: string,
  responseBody: unknown,
): Promise<void> {
  expect(asRecord(responseBody).success).toBe(true);
  await assertContractSnapshot(
    snapshotName,
    buildConsumersStructuralSnapshot(pathPattern, responseBody),
  );
}

test.describe("CONSUMERS — Contract Snapshots", () => {
  test.setTimeout(180_000);

  test(
    "Consumer Profile Contract Snapshot",
    { tag: ["@contract-snapshot", "@consumers", "@profile"] },
    async ({ authenticatedApi }) => {
      const ref = resolveConsumerProfileRef("profile_found")!;
      const { responseBody } = await new ConsumerProfileApi(
        authenticatedApi,
      ).getConsumerProfile(ref, resolveConsumerProfileQuery("profile_found"));
      await snapshotEndpoint(
        "consumers/consumer-profile",
        "/indore/consumers/{ref}/profile",
        responseBody,
      );
    },
  );

  test(
    "Communication Status Contract Snapshot",
    { tag: ["@contract-snapshot", "@consumers", "@communication-status"] },
    async ({ authenticatedApi }) => {
      const ref = resolveCommunicationStatusRef("status_with_date")!;
      const { responseBody } = await new CommunicationStatusApi(
        authenticatedApi,
      ).getCommunicationStatus(
        ref,
        resolveCommunicationStatusQuery("status_with_date"),
      );
      await snapshotEndpoint(
        "consumers/communication-status",
        "/indore/consumers/{ref}/communication-status",
        responseBody,
      );
    },
  );

  test(
    "Billing History Contract Snapshot",
    { tag: ["@contract-snapshot", "@consumers", "@billing-history"] },
    async ({ authenticatedApi }) => {
      const ref = resolveBillingHistoryRef("bh_by_ivrs_all")!;
      const { responseBody } = await new BillingHistoryApi(
        authenticatedApi,
      ).getBillingHistory(ref, resolveBillingHistoryQuery("bh_by_ivrs_all"));
      await snapshotEndpoint(
        "consumers/billing-history",
        "/indore/consumers/{ref}/billing-history",
        responseBody,
      );
    },
  );

  test(
    "Billing Period Contract Snapshot",
    { tag: ["@contract-snapshot", "@consumers", "@billing-period"] },
    async ({ authenticatedApi }) => {
      const { responseBody } = await new BillingPeriodApi(
        authenticatedApi,
      ).getBillingPeriod(billingPeriodData.consumerNumber);
      await snapshotEndpoint(
        "consumers/billing-period",
        "/indore/consumers/{ref}/billing-period",
        responseBody,
      );
    },
  );

  test(
    "Energy Consumption Graph Contract Snapshot",
    { tag: ["@contract-snapshot", "@consumers", "@energy-consumption-graph"] },
    async ({ authenticatedApi }) => {
      const ref = resolveEnergyConsumptionGraphRef("ecg_by_ivrs_daily")!;
      const { responseBody } = await new EnergyConsumptionGraphApi(
        authenticatedApi,
      ).getEnergyConsumptionGraph(
        ref,
        resolveEnergyConsumptionGraphQuery("ecg_by_ivrs_daily"),
      );
      await snapshotEndpoint(
        "consumers/energy-consumption-graph",
        "/indore/consumers/{ref}/energy-consumption-graph",
        responseBody,
      );
    },
  );

  test(
    "Energy Flow Contract Snapshot",
    { tag: ["@contract-snapshot", "@consumers", "@energy-flow"] },
    async ({ authenticatedApi }) => {
      const ref = resolveEnergyFlowRef("ef_by_ivrs_daily")!;
      const { responseBody } = await new EnergyFlowApi(
        authenticatedApi,
      ).getEnergyFlow(ref, resolveEnergyFlowQuery("ef_by_ivrs_daily"));
      await snapshotEndpoint(
        "consumers/energy-flow",
        "/indore/consumers/{ref}/energy-flow",
        responseBody,
      );
    },
  );

  test(
    "Event Log Cards Contract Snapshot",
    { tag: ["@contract-snapshot", "@consumers", "@event-log-cards"] },
    async ({ authenticatedApi }) => {
      const ref = resolveEventLogCardsRef("elc_by_ivrs")!;
      const { responseBody } = await new EventLogCardsApi(
        authenticatedApi,
      ).getEventLogCards(ref, resolveEventLogCardsQuery("elc_by_ivrs"));
      await snapshotEndpoint(
        "consumers/event-log-cards",
        "/indore/consumers/{ref}/event-log/cards",
        responseBody,
      );
    },
  );

  test(
    "Event Log List Contract Snapshot",
    { tag: ["@contract-snapshot", "@consumers", "@event-log-list"] },
    async ({ authenticatedApi }) => {
      const ref = resolveEventLogListRef("ell_by_ivrs")!;
      const { responseBody } = await new EventLogListApi(
        authenticatedApi,
      ).getEventLogList(ref, resolveEventLogListQuery("ell_by_ivrs"));
      await snapshotEndpoint(
        "consumers/event-log-list",
        "/indore/consumers/{ref}/event-log/list",
        responseBody,
      );
    },
  );

  test(
    "Live Load Profile Contract Snapshot",
    { tag: ["@contract-snapshot", "@consumers", "@live-load-profile"] },
    async ({ authenticatedApi }) => {
      const ref = resolveLiveLoadProfileRef("llp_by_ivrs")!;
      const { responseBody } = await new LiveLoadProfileApi(
        authenticatedApi,
      ).getLiveLoadProfile(ref, resolveLiveLoadProfileQuery("llp_by_ivrs"));
      await snapshotEndpoint(
        "consumers/live-load-profile",
        "/indore/consumers/{ref}/live-load-profile",
        responseBody,
      );
    },
  );

  test(
    "Power Quality Contract Snapshot",
    { tag: ["@contract-snapshot", "@consumers", "@power-quality"] },
    async ({ authenticatedApi }) => {
      const ref = resolvePowerQualityRef("pq_by_ivrs")!;
      const { responseBody } = await new PowerQualityApi(
        authenticatedApi,
      ).getPowerQuality(ref, resolvePowerQualityQuery("pq_by_ivrs"));
      await snapshotEndpoint(
        "consumers/power-quality",
        "/indore/consumers/{ref}/power-quality",
        responseBody,
      );
    },
  );

  test(
    "Real Time Power Contract Snapshot",
    { tag: ["@contract-snapshot", "@consumers", "@real-time-power"] },
    async ({ authenticatedApi }) => {
      const ref = resolveRealTimePowerRef("power_by_ivrs")!;
      const { responseBody } = await new RealTimePowerApi(
        authenticatedApi,
      ).getRealTimePower(ref, resolveRealTimePowerQuery("power_by_ivrs"));
      await snapshotEndpoint(
        "consumers/real-time-power",
        "/indore/consumers/{ref}/real-time-power",
        responseBody,
      );
    },
  );

  test(
    "Validate Meter Contract Snapshot",
    { tag: ["@contract-snapshot", "@consumers", "@validate-meter"] },
    async ({ authenticatedApi }) => {
      const serial = resolveValidateConsumerMeterSerial("meter_not_in_system");
      const { responseBody } = await new ValidateMeterApi(
        authenticatedApi,
      ).validateMeter(serial);
      await snapshotEndpoint(
        "consumers/validate-meter",
        "/indore/consumers/validate-meter",
        responseBody,
      );
    },
  );

  test(
    "Nearest Account IDs Contract Snapshot",
    { tag: ["@contract-snapshot", "@consumers", "@nearest-account-ids"] },
    async ({ authenticatedApi }) => {
      const query = resolveNearestAccountIdsQuery("nearest_found")!;
      const { responseBody } = await new NearestAccountIdsApi(
        authenticatedApi,
      ).getNearestAccountIds(query);
      await snapshotEndpoint(
        "consumers/nearest-account-ids",
        "/indore/consumers/nearest-account-ids",
        responseBody,
      );
    },
  );

  test(
    "Activation Contract Snapshot",
    { tag: ["@contract-snapshot", "@consumers", "@activation"] },
    async ({ authenticatedApi }) => {
      const consumerId = resolveActivationConsumerId("activate_idempotent")!;
      const { responseBody } = await new ActivationApi(
        authenticatedApi,
      ).updateActivation(consumerId, { status: "active" });
      await snapshotEndpoint(
        "consumers/activation",
        "/indore/consumers/{id}/activation",
        responseBody,
      );
    },
  );
});
