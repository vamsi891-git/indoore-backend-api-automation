import type pg from "pg";
import type { APIRequestContext } from "@playwright/test";
import { expect } from "@playwright/test";
import { logDbVsApiSection } from "../../../core/db/db-compare.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { LossAnalysisApi } from "../Api/loss-analysis.api";
import {
  buildLossAnalysisQuery,
  feederNetworkLookupId,
} from "../Data/loss-analysis.data";
import { getLossAnalysisPaginatedView } from "../Mapper/loss-analysis.mapper";
import {
  compareEnergyAuditDtrSpotToDb,
  compareEnergyAuditsCountLteDb,
} from "../Db/energy-audits-db-compare";
import {
  countEnergyAuditDtrsUnderRoot,
  getEnergyAuditDtrByNameUnderRoot,
} from "../Db/energy-audits.db";
import { logEnergyAuditsDataQualityFindings } from "../Db/energy-audits-db.validator";

const SPOT_SAMPLE_SIZE = 3;

function trimText(value: unknown): string {
  return String(value ?? "").trim();
}

/**
 * Part 4 harness — aligned with EnergyAuditRepository.getPagedDtrs
 * (feeder loss-analysis total === DTR count under feeder + dtrName/consumerCount spot).
 *
 * inputUnits / lossKwh / lossPct are archive-derived aggregates — intentionally not
 * DB-checked (no single-row equivalent without replaying consumption joins).
 */
export async function runEnergyAuditsDbCoverage(
  authenticatedApi: APIRequestContext,
  db: pg.Pool,
): Promise<void> {
  const validation = new ValidationEngine();
  const networkLookupId = feederNetworkLookupId;
  // DP uses lookup-id archive paths; still returns the same DTR page grain as billing.
  const query = buildLossAnalysisQuery("dp", "feeder", networkLookupId, {
    page: 1,
    limit: 30,
  });
  const api = new LossAnalysisApi(authenticatedApi);
  const { rawResponse, responseBody } = await api.getLossAnalysis(query);
  expect(rawResponse.status()).toBe(200);
  expect(responseBody.success).toBe(true);

  const view = getLossAnalysisPaginatedView(responseBody, query);
  await logEnergyAuditsDataQualityFindings(
    "loss-analysis",
    responseBody.data as unknown as Record<string, unknown>,
  );

  const dbCount = await countEnergyAuditDtrsUnderRoot(db, networkLookupId);
  logDbVsApiSection(
    "Energy-audit loss-analysis (feeder)",
    {
      total: view.totalCount,
      page: view.page,
      limit: view.pageSize,
      rowCount: view.rows.length,
    },
    { total: dbCount },
    { totalMode: "exact" },
  );

  validation.execute(
    "Loss-analysis total equals DTR count under feeder root",
    () => {
      expect(view.totalCount).toBe(dbCount);
      compareEnergyAuditsCountLteDb({
        label: "energy-audit.loss-analysis.total",
        apiCount: view.totalCount,
        dbCount,
      });
    },
  );

  const named = view.rows.filter((row) => trimText(row.dtrName).length > 0);
  expect(
    named.length,
    "Loss-analysis page should include rows with dtrName for spot checks",
  ).toBeGreaterThan(0);

  for (const apiRow of named.slice(0, SPOT_SAMPLE_SIZE)) {
    const dtrName = trimText(apiRow.dtrName);
    const dbRow = await getEnergyAuditDtrByNameUnderRoot(
      db,
      networkLookupId,
      dtrName,
    );
    validation.execute(
      `Energy-audit DTR identity vs DB (${dtrName})`,
      () => {
        expect(dbRow, `DB DTR row missing for name=${dtrName}`).toBeTruthy();
        compareEnergyAuditDtrSpotToDb({
          api: {
            dtrName,
            consumerCount: apiRow.consumerCount,
          },
          dbRow: dbRow!,
        });
      },
    );
  }

  validation.printSummary("ENERGY-AUDITS DB Coverage", 0);
}
