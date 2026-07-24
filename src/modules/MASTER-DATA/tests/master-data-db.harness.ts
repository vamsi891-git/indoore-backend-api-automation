import type pg from "pg";
import type { APIRequestContext } from "@playwright/test";
import { expect } from "@playwright/test";
import {
  assertDbVsApiScalar,
  compareApiToDb,
  logDbVsApiSection,
} from "../../../core/db/db-compare.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { MeterMasterApi } from "../Api/meter-master.api";
import { DtrMasterApi } from "../Api/dtr-master.api";
import { ConsumerMasterApi } from "../Api/consumer-master.api";
import { FeederMasterApi } from "../Api/feeder-master.api";
import { SubstationMasterApi } from "../Api/substation-master.api";
import { MeterCommunicationStatusApi } from "../Api/meter-communication-status.api";
import {
  masterDataDefaultQuery,
  meterMasterDefaultQuery,
} from "../Data/master-data.common.data";
import {
  countActiveMeters,
  countConsumerMasterRows,
  countDtrMasterRows,
  countFeederMasterRows,
  countSubstationMasterRows,
  getActiveMeterBySerial,
  getConsumerByMeterLookupId,
  getDtrByMeterLookupId,
  getFeederByName,
  getMeterCommunicationBySerial,
  getSubstationByCode,
  isMeterAlreadyOnDtrInDb,
} from "../Db/master-data.db";
import {
  compareConsumerMasterSpotToDb,
  compareDtrMasterSpotToDb,
  compareFeederMasterSpotToDb,
  compareMasterDataCountLteDb,
  compareMeterMasterSpotToDb,
  compareSubstationMasterSpotToDb,
} from "../Db/master-data-db-compare";
import { logMasterDataDataQualityFindings } from "../Db/master-data-db.validator";

/**
 * Part 4 harness — aligned with MasterDataRepository SQL paste
 * (feeder/substation base SQL + DTR-type meter grain + meter/consumer counts).
 */
export async function runMasterDataDbCoverage(
  authenticatedApi: APIRequestContext,
  db: pg.Pool,
): Promise<void> {
  const validation = new ValidationEngine();
  const listQuery = { ...masterDataDefaultQuery };
  const meterQuery = { ...meterMasterDefaultQuery };

  // --- Meter master ---
  {
    const { responseBody } = await new MeterMasterApi(
      authenticatedApi,
    ).getMeterMasterData(meterQuery);
    await logMasterDataDataQualityFindings(
      "meter-master",
      responseBody.data as unknown as Record<string, unknown>,
    );
    const apiTotal =
      responseBody.data?.pagination?.total ?? responseBody.data?.total ?? 0;
    const dbTotal = await countActiveMeters(db);
    logDbVsApiSection(
      "Meter Master",
      {
        total: apiTotal,
        page: meterQuery.page ?? 1,
        limit: meterQuery.limit ?? 20,
        rowCount: responseBody.data?.rows?.length ?? 0,
      },
      { total: dbTotal },
      { totalMode: "exact" },
    );
    validation.execute("Meter Master total vs L_Meter_Lookup", () => {
      assertDbVsApiScalar(
        "total active meters",
        apiTotal,
        dbTotal,
        "DB vs API — Meter Master total",
      );
    });

    const apiRow = (responseBody.data?.rows ?? []).find((row) =>
      row.meterSerialNumber?.trim(),
    );
    if (apiRow?.meterSerialNumber?.trim()) {
      const dbRow = await getActiveMeterBySerial(
        db,
        apiRow.meterSerialNumber.trim(),
      );
      validation.execute("Meter Master spot serial vs DB", () => {
        expect(dbRow, "DB row for API meter serial").toBeTruthy();
        compareMeterMasterSpotToDb({
          api: {
            meterLookupTblRefId: apiRow.meterLookupTblRefId,
            mf: apiRow.mf,
            meterSerialNumber: apiRow.meterSerialNumber,
          },
          dbRow: dbRow!,
        });
      });
    }
  }

  // --- DTR master ---
  {
    const { responseBody } = await new DtrMasterApi(
      authenticatedApi,
    ).getDtrMasterData(listQuery);
    await logMasterDataDataQualityFindings(
      "dtr-master",
      responseBody.data as unknown as Record<string, unknown>,
    );
    const apiTotal =
      responseBody.data?.pagination?.total ?? responseBody.data?.total ?? 0;
    const dbTotal = await countDtrMasterRows(db);
    logDbVsApiSection(
      "DTR Master",
      {
        total: apiTotal,
        page: listQuery.page ?? 1,
        limit: listQuery.limit ?? 20,
        rowCount: responseBody.data?.rows?.length ?? 0,
      },
      { total: dbTotal },
      { totalMode: "lte" },
    );
    validation.execute("DTR Master total ≤ DB DTR-type meter universe", () => {
      compareMasterDataCountLteDb({
        label: "dtrMaster.total",
        apiCount: apiTotal,
        dbCount: dbTotal,
      });
    });

    const apiRow = (responseBody.data?.rows ?? []).find(
      (row) => (row.meterLookupTblRefId ?? 0) > 0,
    );
    if (apiRow?.meterLookupTblRefId) {
      const lookupId = apiRow.meterLookupTblRefId;
      const dbRow = await getDtrByMeterLookupId(db, lookupId);
      const onDtr = await isMeterAlreadyOnDtrInDb(db, lookupId);
      validation.execute("DTR Master spot lookup vs DB", () => {
        expect(dbRow, "DB row for API DTR meter lookup").toBeTruthy();
        expect(onDtr, "API DTR row should be on DTR network in DB").toBe(true);
        compareDtrMasterSpotToDb({
          api: {
            meterLookupTblRefId: lookupId,
            dtr: apiRow.dtr,
            feeder: apiRow.feeder,
            meterSerialNumber: apiRow.meterSerialNumber,
            mf: apiRow.mf,
          },
          dbRow: dbRow!,
        });
      });
    }
  }

  // --- Consumer master ---
  {
    const { responseBody } = await new ConsumerMasterApi(
      authenticatedApi,
    ).getConsumerMasterData({ ...listQuery, meterType: "all" });
    await logMasterDataDataQualityFindings(
      "consumer-master",
      responseBody.data as unknown as Record<string, unknown>,
    );
    const apiTotal =
      responseBody.data?.pagination?.total ?? responseBody.data?.total ?? 0;
    const dbTotal = await countConsumerMasterRows(db);
    const tolerance = Math.max(200, Math.ceil(dbTotal * 0.001));
    logDbVsApiSection(
      "Consumer Master",
      {
        total: apiTotal,
        page: listQuery.page ?? 1,
        limit: listQuery.limit ?? 20,
        rowCount: responseBody.data?.rows?.length ?? 0,
      },
      { total: dbTotal },
      { totalMode: "tolerance", tolerance },
    );
    validation.execute("Consumer Master total within tolerance of DB", () => {
      const delta = Math.abs(apiTotal - dbTotal);
      expect(
        delta,
        `API total ${apiTotal} should be within ${tolerance} of DB ${dbTotal}`,
      ).toBeLessThanOrEqual(tolerance);
    });

    const apiRow = (responseBody.data?.rows ?? []).find(
      (row) => row.meterLookupTblRefId > 0 && row.meterSerialNumber?.trim(),
    );
    if (apiRow) {
      const dbRow = await getConsumerByMeterLookupId(
        db,
        apiRow.meterLookupTblRefId,
      );
      validation.execute("Consumer Master spot vs V_Consumerdetails", () => {
        expect(dbRow, "DB row for API meter lookup id").toBeTruthy();
        compareConsumerMasterSpotToDb({
          api: {
            meterLookupTblRefId: apiRow.meterLookupTblRefId,
            meterSerialNumber: apiRow.meterSerialNumber,
            ivrsNo: apiRow.ivrsNo,
          },
          dbRow: dbRow!,
        });
      });
    }
  }

  // --- Feeder master ---
  {
    const { responseBody } = await new FeederMasterApi(
      authenticatedApi,
    ).getFeederMasterData(listQuery);
    await logMasterDataDataQualityFindings(
      "feeder-master",
      responseBody.data as unknown as Record<string, unknown>,
    );
    const apiTotal =
      responseBody.data?.pagination?.total ?? responseBody.data?.total ?? 0;
    const dbTotal = await countFeederMasterRows(db);
    logDbVsApiSection(
      "Feeder Master",
      {
        total: apiTotal,
        page: listQuery.page ?? 1,
        limit: listQuery.limit ?? 20,
        rowCount: responseBody.data?.rows?.length ?? 0,
      },
      { total: dbTotal },
      { totalMode: "exact" },
    );
    validation.execute("Feeder Master total vs feederMasterDataBaseSql", () => {
      assertDbVsApiScalar(
        "total feeder master rows",
        apiTotal,
        dbTotal,
        "DB vs API — Feeder Master total",
      );
    });

    const apiRow = (responseBody.data?.rows ?? []).find((row) =>
      row.feederName?.trim(),
    );
    if (apiRow?.feederName?.trim()) {
      const dbRow = await getFeederByName(db, apiRow.feederName.trim());
      validation.execute("Feeder Master spot name vs DB", () => {
        expect(dbRow, "DB row for API feeder name").toBeTruthy();
        compareFeederMasterSpotToDb({
          api: {
            feederName: apiRow.feederName,
            dtrCount: apiRow.dtrCount,
            consumerCount: apiRow.consumerCount,
          },
          dbRow: dbRow!,
        });
      });
    }
  }

  // --- Substation master ---
  {
    const { responseBody } = await new SubstationMasterApi(
      authenticatedApi,
    ).getSubstationMasterData(listQuery);
    await logMasterDataDataQualityFindings(
      "substation-master",
      responseBody.data as unknown as Record<string, unknown>,
    );
    const apiTotal =
      responseBody.data?.pagination?.total ?? responseBody.data?.total ?? 0;
    const dbTotal = await countSubstationMasterRows(db);
    logDbVsApiSection(
      "Substation Master",
      {
        total: apiTotal,
        page: listQuery.page ?? 1,
        limit: listQuery.limit ?? 20,
        rowCount: responseBody.data?.rows?.length ?? 0,
      },
      { total: dbTotal },
      { totalMode: "exact" },
    );
    validation.execute(
      "Substation Master total vs substationMasterDataBaseSql",
      () => {
        assertDbVsApiScalar(
          "total substation master rows",
          apiTotal,
          dbTotal,
          "DB vs API — Substation Master total",
        );
      },
    );

    const apiRow = (responseBody.data?.rows ?? []).find((row) =>
      row.substationCode?.trim(),
    );
    if (apiRow?.substationCode?.trim()) {
      const dbRow = await getSubstationByCode(db, apiRow.substationCode.trim());
      validation.execute("Substation Master spot code vs DB", () => {
        expect(dbRow, "DB row for API substation code").toBeTruthy();
        compareSubstationMasterSpotToDb({
          api: {
            substationCode: apiRow.substationCode!,
            dtrCount: apiRow.dtrCount,
            consumerCount: apiRow.consumerCount,
          },
          dbRow: dbRow!,
        });
      });
    }
  }

  // --- Meter communication ---
  {
    const { responseBody } = await new MeterCommunicationStatusApi(
      authenticatedApi,
    ).getMeterCommunicationStatus(listQuery);
    await logMasterDataDataQualityFindings(
      "meter-communication",
      responseBody.data as unknown as Record<string, unknown>,
    );
    const rows = responseBody.data?.rows ?? responseBody.data?.items ?? [];
    const apiRow = rows.find((row) => row.meterSerialNumber?.trim());
    if (apiRow?.meterSerialNumber?.trim()) {
      const serial = apiRow.meterSerialNumber.trim();
      const dbRow = await getMeterCommunicationBySerial(db, serial);
      validation.execute("Meter Communication serial exists in DB", () => {
        expect(dbRow, "DB row for API meter serial").toBeTruthy();
        compareApiToDb(
          [
            {
              label: "meterSerialNumber",
              apiValue: serial,
              dbValue: dbRow!.meterSerialNumber?.trim(),
            },
          ],
          "DB vs API — Meter Communication spot check",
        );
      });
    }
  }

  validation.printSummary("MASTER-DATA DB Coverage", 0);
}
