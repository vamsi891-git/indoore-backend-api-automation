/**
 * FEEDER contract snapshots — structural only (volatile values not snapshotted).
 *
 * First run / intentional shape change:
 *   UPDATE_CONTRACT_SNAPSHOTS=true npm run test:feeder:contract
 */
import { test, expect } from "../../../fixtures/observability.fixture";
import {
  assertContractSnapshot,
  buildLookupItemsContractSnapshot,
} from "../../../core/contract/contract-snapshot.helper";
import { FeederProfileApi } from "../Api/feederprofile.api";
import { FeederAlertsApi } from "../Api/feeder-alerts.api";
import { FeederElectricalParametersApi } from "../Api/feeder-electrical-parameters.api";
import { FeederDailyConsumptionApi } from "../Api/feeder-daily-consumption.api";
import { feederProfileData } from "../Data/feederprofile.data";
import { feederAlertsData } from "../Data/feeder-alerts.data";
import { feederElectricalParametersData } from "../Data/feeder-electrical-parameters.data";
import { feederDailyConsumptionData } from "../Data/feeder-daily-consumption.data";

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function resolveFeederCode(fallback: string): string {
  return process.env.FEEDER_CODE?.trim() || fallback;
}

test.describe("FEEDER — Contract Snapshots", () => {
  test.setTimeout(180_000);

  test(
    "Feeder Profile Contract Snapshot",
    { tag: ["@contract-snapshot", "@feeder", "@profile"] },
    async ({ authenticatedApi }) => {
      const code = resolveFeederCode(feederProfileData.feederCode);
      const { responseBody } = await new FeederProfileApi(
        authenticatedApi,
      ).getFeederProfile(code);
      expect(responseBody.success).toBe(true);
      const data = asRecord(responseBody.data);
      await assertContractSnapshot(
        "feeder/feeder-profile",
        buildLookupItemsContractSnapshot({
          pathPattern: "/indore/feeder/{feederCode}/profile",
          dataKeys: Object.keys(data),
          itemKeys: Array.isArray(data.overview) && data.overview.length > 0
            ? Object.keys(asRecord(data.overview[0]))
            : Object.keys(data),
        }),
      );
    },
  );

  test(
    "Feeder Alerts Contract Snapshot",
    { tag: ["@contract-snapshot", "@feeder", "@feeder-alerts"] },
    async ({ authenticatedApi }) => {
      const code = resolveFeederCode(feederAlertsData.feederCode);
      const { responseBody } = await new FeederAlertsApi(
        authenticatedApi,
      ).getAlerts(code, feederAlertsData.page, feederAlertsData.limit);
      expect(responseBody.success).toBe(true);
      const data = asRecord(responseBody.data);
      const rows = Array.isArray(data.rows) ? data.rows : [];
      await assertContractSnapshot(
        "feeder/feeder-alerts",
        buildLookupItemsContractSnapshot({
          pathPattern: "/indore/feeder/{feederCode}/alerts",
          dataKeys: Object.keys(data),
          itemKeys: rows.length > 0 ? Object.keys(asRecord(rows[0])) : [],
        }),
      );
    },
  );

  test(
    "Feeder Electrical Parameters Contract Snapshot",
    { tag: ["@contract-snapshot", "@feeder", "@electrical-parameters"] },
    async ({ authenticatedApi }) => {
      const code = resolveFeederCode(
        feederElectricalParametersData.feederCode,
      );
      const { responseBody } = await new FeederElectricalParametersApi(
        authenticatedApi,
      ).getElectricalParameters(code);
      expect(responseBody.success).toBe(true);
      const data = asRecord(responseBody.data);
      // Lock phase envelope keys; voltages/currents drift.
      await assertContractSnapshot(
        "feeder/feeder-electrical-parameters",
        buildLookupItemsContractSnapshot({
          pathPattern: "/indore/feeder/{feederCode}/electrical-parameters",
          dataKeys: Object.keys(data).sort(),
          itemKeys: ["current", "currentUnit", "voltage", "voltageUnit"],
        }),
      );
    },
  );

  test(
    "Feeder Daily Consumption Contract Snapshot",
    { tag: ["@contract-snapshot", "@feeder", "@daily-consumption"] },
    async ({ authenticatedApi }) => {
      const code = resolveFeederCode(feederDailyConsumptionData.feederCode);
      const { responseBody } = await new FeederDailyConsumptionApi(
        authenticatedApi,
      ).getDailyConsumption(code, feederDailyConsumptionData.granularity);
      expect(responseBody.success).toBe(true);
      const data = asRecord(responseBody.data);
      const points = Array.isArray(data.points) ? data.points : [];
      await assertContractSnapshot(
        "feeder/feeder-daily-consumption",
        buildLookupItemsContractSnapshot({
          pathPattern: "/indore/feeder/{feederCode}/daily-consumption",
          dataKeys: Object.keys(data),
          itemKeys: points.length > 0 ? Object.keys(asRecord(points[0])) : [],
        }),
      );
    },
  );
});
