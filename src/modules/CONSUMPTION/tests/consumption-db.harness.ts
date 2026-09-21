import type pg from "pg";
import type { APIRequestContext } from "@playwright/test";
import { expect } from "@playwright/test";
import { logDbVsApiSection } from "../../../extras/db/db-compare.engine";
import { isArchiveDbConfigured } from "../../../extras/db/postgres.client";
import { DailyConsumptionApi } from "../Api/dailyconsumption.api";
import { MonthlyNetMeterApi } from "../Api/monthlynetmeter.api";
import { PatternConsumptionApi } from "../Api/patternconsumption.api";
import { dailyConsumptionData } from "../Data/dailyconsumption.data";
import { monthlyNetMeterData } from "../Data/monthlynetmeter.data";
import { patternConsumptionData } from "../Data/patternconsumption.data";
import { DailyConsumptionMapper } from "../Mapper/dailyconsumption.mapper";
import { MonthlyNetMeterMapper } from "../Mapper/monthlynetmeter.mapper";
import { PatternConsumptionMapper } from "../Mapper/patternconsumption.mapper";
import {
  compareConsumptionConsumerSpotToDb,
  compareConsumptionCountLteDb,
  compareConsumptionDailyReadingToDb,
  compareConsumptionPatternTotalToDb,
} from "../Db/consumption-db-compare";
import {
  countConsumptionActiveConsumerMeters,
  countConsumptionActiveNetMeters,
  countConsumptionListPageKeys,
  getConsumptionConsumerByMsn,
  getConsumptionDailyReadingAgg,
} from "../Db/consumption.db";
import { logConsumptionDataQualityFindings } from "../Db/consumption-db.validator";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

const SPOT_SAMPLE_SIZE = 3;

function trimText(value: unknown): string {
  return String(value ?? "").trim();
}

/**
 * Part 4 harness — aligned with ConsumptionRepository
 * (daily report pagination total ≤ unscoped consumer-master count + identity spot
 * + archive IR/FR/kWh when the page already has readings).
 */
export async function runConsumptionDbCoverage(
  authenticatedApi: APIRequestContext,
  db: pg.Pool,
  archiveDb?: pg.Pool | null,
): Promise<void> {
  const validation = new ApiValidationHelper();
  const api = new DailyConsumptionApi(authenticatedApi);
  const { rawResponse, responseBody } = await api.getDailyReport(
    dailyConsumptionData.page,
    dailyConsumptionData.limit,
    dailyConsumptionData.fromDate,
    dailyConsumptionData.toDate,
    dailyConsumptionData.month,
    dailyConsumptionData.year,
  );

  expect(rawResponse.status()).toBe(200);
  const mapped = DailyConsumptionMapper.map(responseBody);
  expect(mapped.success).toBe(true);
  await logConsumptionDataQualityFindings(
    "daily",
    responseBody.data as unknown as Record<string, unknown>,
  );

  const dbCount = await countConsumptionActiveConsumerMeters(db);
  logDbVsApiSection(
    "Consumption daily report",
    {
      total: mapped.total,
      page: mapped.page,
      limit: mapped.limit,
      rowCount: mapped.items.length,
    },
    { total: dbCount },
    { totalMode: "lte" },
  );

  validation.execute("Consumption daily total ≤ unscoped consumer-master count", () => {
    compareConsumptionCountLteDb({
      label: "consumption.daily.total",
      apiCount: mapped.total,
      dbCount,
    });
  });

  const withMsn = mapped.items.filter((row) => trimText(row.msn).length > 0);
  expect(
    withMsn.length,
    "Daily consumption page should include rows with msn for spot checks",
  ).toBeGreaterThan(0);

  for (const apiRow of withMsn.slice(0, SPOT_SAMPLE_SIZE)) {
    const msn = trimText(apiRow.msn);
    const dbRow = await getConsumptionConsumerByMsn(db, msn, apiRow.ivrsNumber);
    validation.execute(`Consumption consumer identity vs DB (${msn})`, () => {
      expect(dbRow, `DB consumer row missing for msn=${msn}`).toBeTruthy();
      compareConsumptionConsumerSpotToDb({
        api: {
          msn,
          name: apiRow.name,
          ivrsNumber: apiRow.ivrsNumber,
          phase: apiRow.phase,
        },
        dbRow: dbRow!,
      });
    });
  }

  // --- Archive daily IR/FR/kWh (fast path: only when page already has readings) ---
  if (archiveDb && isArchiveDbConfigured()) {
    const withReadings = withMsn.find((row) => row.ir != null && row.fr != null);
    if (!withReadings) {
      console.warn(
        `[BACKEND FINDING] daily IR/FR spot skipped — no page row with ir/fr in ${dailyConsumptionData.fromDate}..${dailyConsumptionData.toDate} (archive SQL ready for when readings exist)`,
      );
    } else {
      const msn = trimText(withReadings.msn);
      const identity = await getConsumptionConsumerByMsn(db, msn, withReadings.ivrsNumber);
      if (!identity?.meterLookupTblRefId) {
        console.warn(
          `[BACKEND FINDING] daily IR/FR spot skipped — no meterLookupId for msn=${msn}`,
        );
      } else {
        const reading = await getConsumptionDailyReadingAgg(
          archiveDb,
          identity.meterLookupTblRefId,
          dailyConsumptionData.fromDate,
          dailyConsumptionData.toDate,
        );
        validation.execute(`Daily IR/FR/kWh vs archive T_DPData_CateSP (${msn})`, () => {
          compareConsumptionDailyReadingToDb({
            api: {
              msn,
              ir: withReadings.ir,
              fr: withReadings.fr,
              kwh: withReadings.kwh,
            },
            dbRow: reading,
          });
        });
      }
    }
  } else {
    console.warn("[BACKEND FINDING] daily IR/FR DB check skipped — archive DB not configured");
  }

  // --- Soft: monthly-net-meter total ≤ active isnetmeter count ---
  try {
    const netApi = new MonthlyNetMeterApi(authenticatedApi);
    const netRes = await netApi.getMonthlyNetMeter(
      monthlyNetMeterData.page,
      monthlyNetMeterData.limit,
      monthlyNetMeterData.month,
      monthlyNetMeterData.year,
    );
    if (netRes.rawResponse.status() === 200) {
      const netMapped = MonthlyNetMeterMapper.map(netRes.responseBody);
      const netDbCount = await countConsumptionActiveNetMeters(db);
      logDbVsApiSection(
        "Consumption monthly net-meter",
        {
          total: netMapped.total,
          page: netMapped.page,
          limit: netMapped.limit,
          rowCount: netMapped.items.length,
        },
        { total: netDbCount },
        { totalMode: "lte" },
      );
      validation.execute("Monthly net-meter total ≤ unscoped isnetmeter count", () => {
        compareConsumptionCountLteDb({
          label: "consumption.monthly-net-meter.total",
          apiCount: netMapped.total,
          dbCount: netDbCount,
        });
      });
    } else {
      console.warn(
        `[BACKEND FINDING] monthly-net-meter DB check skipped — API status ${netRes.rawResponse.status()}`,
      );
    }
  } catch (err) {
    console.warn(
      `[BACKEND FINDING] monthly-net-meter DB check soft-failed: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }

  // --- Soft: pattern-consumption totalCount vs unscoped page-key COUNT ---
  try {
    const patternApi = new PatternConsumptionApi(authenticatedApi);
    const { page, limit, month, year } = patternConsumptionData;
    const patternTypes = [
      {
        type: patternConsumptionData.lastThreeMonthsType,
        label: "lastThree",
      },
      { type: patternConsumptionData.yearlyType, label: "yearly" },
      {
        type: patternConsumptionData.comparisonType,
        label: "comparison",
      },
    ] as const;

    const dbPageKeyCount = await countConsumptionListPageKeys(db);
    console.info(
      `[pattern-db] unscoped page-key COUNT (consumptionPageKeyFromSql) = ${dbPageKeyCount}`,
    );

    for (const { type, label } of patternTypes) {
      const patternRes = await patternApi.getPatternConsumption(type, page, limit, month, year);
      if (patternRes.rawResponse.status() !== 200) {
        console.warn(
          `[BACKEND FINDING] pattern ${label} DB check skipped — API status ${patternRes.rawResponse.status()}`,
        );
        continue;
      }

      const mapped = PatternConsumptionMapper.map(patternRes.responseBody);
      const sample = mapped.rows[0] ?? null;
      console.info(
        JSON.stringify(
          {
            msg: "pattern_consumption_response_summary",
            patternType: type,
            title: mapped.title,
            columnKeys: mapped.columns.map((c) => c.key),
            rowCount: mapped.rows.length,
            pagination: mapped.pagination,
            sampleRow: sample
              ? {
                  slNo: sample.slNo,
                  name: sample.name,
                  ivrsNumber: sample.ivrsNumber,
                  phase: sample.phase,
                  sanctionLoadKw: sample.sanctionLoadKw,
                  msn: sample.msn ?? sample.meterSerialNo ?? null,
                }
              : null,
          },
          null,
          2,
        ),
      );

      validation.execute(`Pattern ${label} totalCount vs DB page-key count`, () => {
        compareConsumptionPatternTotalToDb({
          label: `consumption.pattern.${label}.totalCount`,
          apiCount: mapped.pagination.totalCount,
          dbCount: dbPageKeyCount,
        });
      });

      const msnField = label === "comparison" ? "meterSerialNo" : "msn";
      const withMsn = mapped.rows.filter((row) => trimText(row[msnField]).length > 0);
      for (const apiRow of withMsn.slice(0, SPOT_SAMPLE_SIZE)) {
        const msn = trimText(apiRow[msnField]);
        const dbRow = await getConsumptionConsumerByMsn(db, msn, String(apiRow.ivrsNumber ?? ""));
        validation.execute(`Pattern ${label} consumer identity vs DB (${msn})`, () => {
          expect(dbRow, `DB consumer row missing for msn=${msn}`).toBeTruthy();
          compareConsumptionConsumerSpotToDb({
            api: {
              msn,
              name: String(apiRow.name ?? ""),
              ivrsNumber: String(apiRow.ivrsNumber ?? ""),
              phase: String(apiRow.phase ?? ""),
            },
            dbRow: dbRow!,
          });
        });
      }
    }
  } catch (err) {
    console.warn(
      `[BACKEND FINDING] pattern-consumption DB check soft-failed: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }

  validation.printSummary("CONSUMPTION DB Coverage", 0);
}
