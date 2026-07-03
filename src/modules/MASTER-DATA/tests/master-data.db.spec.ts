import { expect } from "@playwright/test";
import { test as apiDbTest } from "../../../fixtures/api-db.fixture";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import {
  assertDbVsApiScalar,
  compareApiToDb,
  logDbVsApiSection,
} from "../../../core/db/db-compare.engine";
import { MeterMasterApi } from "../Api/meter-master.api";
import { DtrMasterApi } from "../Api/dtr-master.api";
import { ConsumerMasterApi } from "../Api/consumer-master.api";
import { FeederMasterApi } from "../Api/feeder-master.api";
import { SubstationMasterApi } from "../Api/substation-master.api";
import { MeterCommunicationStatusApi } from "../Api/meter-communication-status.api";
import { masterDataDefaultQuery, meterMasterDefaultQuery } from "../Data/master-data.common.data";
import {
  countActiveMeters,
  countConsumerMasterRows,
  countDtrMasterRows,
  countFeederMasterRows,
  countSubstationMasterRows,
  getActiveMeterBySerial,
  getConsumerByMeterLookupId,
  getMeterCommunicationBySerial,
} from "../Db/master-data.db";

apiDbTest.describe("Master Data — DB validation", () => {
  apiDbTest.describe.configure({ retries: 1, mode: "serial" });
  apiDbTest.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  apiDbTest(
    "Meter Master — API total matches DB active meter count",
    { tag: ["@master-data", "@meter-master", "@db"] },
    async ({ authenticatedApi, db }) => {
      const api = new MeterMasterApi(authenticatedApi);
      const query = { ...meterMasterDefaultQuery };
      const { responseBody } = await api.getMeterMasterData(query);

      const apiTotal =
        responseBody.data?.pagination?.total ?? responseBody.data?.total ?? 0;
      const dbTotal = await countActiveMeters(db);

      logDbVsApiSection(
        "Meter Master",
        {
          total: apiTotal,
          page: query.page ?? 1,
          limit: query.limit ?? 20,
          rowCount: responseBody.data?.rows?.length ?? 0,
        },
        { total: dbTotal },
        { totalMode: "exact" },
      );

      assertDbVsApiScalar(
        "total active meters",
        apiTotal,
        dbTotal,
        "DB vs API — Meter Master total",
      );
    },
  );

  apiDbTest(
    "Meter Master — first page row matches DB for known serial",
    { tag: ["@master-data", "@meter-master", "@db"] },
    async ({ authenticatedApi, db }) => {
      const api = new MeterMasterApi(authenticatedApi);
      const { responseBody } = await api.getMeterMasterData({
        ...meterMasterDefaultQuery,
      });

      const apiRow = (responseBody.data?.rows ?? []).find((row) =>
        row.meterSerialNumber?.trim(),
      );

      if (!apiRow?.meterSerialNumber?.trim()) {
        apiDbTest.skip(true, "No meter serial on page 1 for DB spot check");
        return;
      }

      const dbRow = await getActiveMeterBySerial(
        db,
        apiRow.meterSerialNumber.trim(),
      );
      expect(dbRow, "DB row for API meter serial").toBeTruthy();

      compareApiToDb(
        [
          {
            label: "meterLookupTblRefId",
            apiValue: apiRow.meterLookupTblRefId,
            dbValue: dbRow!.meterLookupTblRefId,
          },
          {
            label: "mf",
            apiValue: apiRow.mf,
            dbValue: dbRow!.mf,
          },
          {
            label: "meterSerialNumber",
            apiValue: apiRow.meterSerialNumber?.trim(),
            dbValue: dbRow!.meterSerialNumber?.trim(),
          },
        ],
        "DB vs API — Meter Master spot check",
      );
    },
  );

  apiDbTest(
    "DTR Master — API total within DB DTR row universe",
    { tag: ["@master-data", "@dtr-master", "@db"] },
    async ({ authenticatedApi, db }) => {
      const api = new DtrMasterApi(authenticatedApi);
      const query = { ...masterDataDefaultQuery };
      const { responseBody } = await api.getDtrMasterData(query);

      const apiTotal =
        responseBody.data?.pagination?.total ?? responseBody.data?.total ?? 0;
      const dbTotal = await countDtrMasterRows(db);

      logDbVsApiSection(
        "DTR Master",
        {
          total: apiTotal,
          page: query.page ?? 1,
          limit: query.limit ?? 20,
          rowCount: responseBody.data?.rows?.length ?? 0,
        },
        { total: dbTotal },
        { totalMode: "lte" },
      );

      expect(
        apiTotal,
        "JWT-scoped API total should not exceed unscoped DB universe",
      ).toBeLessThanOrEqual(dbTotal);
    },
  );

  apiDbTest(
    "Consumer Master — first page row matches DB for known meter",
    { tag: ["@master-data", "@consumer-master", "@db"] },
    async ({ authenticatedApi, db }) => {
      const api = new ConsumerMasterApi(authenticatedApi);
      const { responseBody } = await api.getConsumerMasterData({
        ...masterDataDefaultQuery,
      });

      const apiRow = (responseBody.data?.rows ?? []).find(
        (row) => row.meterLookupTblRefId > 0 && row.meterSerialNumber?.trim(),
      );

      if (!apiRow) {
        apiDbTest.skip(true, "No consumer row on page 1 for DB spot check");
        return;
      }

      const dbRow = await getConsumerByMeterLookupId(
        db,
        apiRow.meterLookupTblRefId,
      );
      expect(dbRow, "DB row for API meter lookup id").toBeTruthy();

      compareApiToDb(
        [
          {
            label: "meterLookupTblRefId",
            apiValue: apiRow.meterLookupTblRefId,
            dbValue: dbRow!.meterLookupTblRefId,
          },
          {
            label: "meterSerialNumber",
            apiValue: apiRow.meterSerialNumber?.trim(),
            dbValue: dbRow!.meterSerialNumber?.trim(),
          },
          {
            label: "ivrsNo",
            apiValue: apiRow.ivrsNo?.trim() ?? null,
            dbValue: dbRow!.ivrsNo?.trim() ?? null,
            optional: true,
          },
        ],
        "DB vs API — Consumer Master spot check",
      );
    },
  );

  apiDbTest(
    "Consumer Master — API total within DB consumer row universe",
    { tag: ["@master-data", "@consumer-master", "@db"] },
    async ({ authenticatedApi, db }) => {
      const api = new ConsumerMasterApi(authenticatedApi);
      const query = { ...masterDataDefaultQuery };
      const { responseBody } = await api.getConsumerMasterData(query);

      const apiTotal =
        responseBody.data?.pagination?.total ?? responseBody.data?.total ?? 0;
      const dbTotal = await countConsumerMasterRows(db);

      logDbVsApiSection(
        "Consumer Master",
        {
          total: apiTotal,
          page: query.page ?? 1,
          limit: query.limit ?? 20,
          rowCount: responseBody.data?.rows?.length ?? 0,
        },
        { total: dbTotal },
        {
          totalMode: "tolerance",
          tolerance: Math.max(200, Math.ceil(dbTotal * 0.001)),
        },
      );

      const delta = Math.abs(apiTotal - dbTotal);
      expect(
        delta,
        `API total ${apiTotal} should be within 0.1% of DB total ${dbTotal}`,
      ).toBeLessThanOrEqual(Math.max(200, Math.ceil(dbTotal * 0.001)));
    },
  );

  apiDbTest(
    "Meter Communication — first page row serial exists in DB",
    { tag: ["@master-data", "@meter-communication", "@db"] },
    async ({ authenticatedApi, db }) => {
      const api = new MeterCommunicationStatusApi(authenticatedApi);
      const { responseBody } = await api.getMeterCommunicationStatus({
        ...masterDataDefaultQuery,
      });

      const rows = responseBody.data?.rows ?? responseBody.data?.items ?? [];
      const apiRow = rows.find((row) => row.meterSerialNumber?.trim());

      if (!apiRow?.meterSerialNumber?.trim()) {
        apiDbTest.skip(true, "No meter serial on page 1 for DB spot check");
        return;
      }

      const serial = apiRow.meterSerialNumber.trim();
      const dbRow = await getMeterCommunicationBySerial(db, serial);
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
    },
  );

  apiDbTest(
    "Feeder Master — API total matches DB feeder count",
    { tag: ["@master-data", "@feeder-master", "@db"] },
    async ({ authenticatedApi, db }) => {
      const api = new FeederMasterApi(authenticatedApi);
      const query = { ...masterDataDefaultQuery };
      const { responseBody } = await api.getFeederMasterData(query);

      const apiTotal =
        responseBody.data?.pagination?.total ?? responseBody.data?.total ?? 0;
      const dbTotal = await countFeederMasterRows(db);

      logDbVsApiSection(
        "Feeder Master",
        {
          total: apiTotal,
          page: query.page ?? 1,
          limit: query.limit ?? 20,
          rowCount: responseBody.data?.rows?.length ?? 0,
        },
        { total: dbTotal },
        { totalMode: "exact" },
      );

      assertDbVsApiScalar(
        "total feeder master rows",
        apiTotal,
        dbTotal,
        "DB vs API — Feeder Master total",
      );
    },
  );

  apiDbTest(
    "Substation Master — API total matches DB substation count",
    { tag: ["@master-data", "@substation-master", "@db"] },
    async ({ authenticatedApi, db }) => {
      const api = new SubstationMasterApi(authenticatedApi);
      const query = { ...masterDataDefaultQuery };
      const { responseBody } = await api.getSubstationMasterData(query);

      const apiTotal =
        responseBody.data?.pagination?.total ?? responseBody.data?.total ?? 0;
      const dbTotal = await countSubstationMasterRows(db);

      logDbVsApiSection(
        "Substation Master",
        {
          total: apiTotal,
          page: query.page ?? 1,
          limit: query.limit ?? 20,
          rowCount: responseBody.data?.rows?.length ?? 0,
        },
        { total: dbTotal },
        { totalMode: "exact" },
      );

      assertDbVsApiScalar(
        "total substation master rows",
        apiTotal,
        dbTotal,
        "DB vs API — Substation Master total",
      );
    },
  );
});
