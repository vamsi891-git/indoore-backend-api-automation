import { test } from "../../../fixtures/observability.fixture";
import { compareApiToDb } from "../../../core/db/db-compare.engine";
import { getBillingMeterHeaderBySerial } from "../../BILLING/Db/billing.db";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { DtrBillingApi } from "../Api/dtrbilling.api";
import { DtrBillingMapper } from "../Mapper/dtrbilling.mapper";
import { resolveDtrBillingQuery } from "../Data/dtrbilling.data";

/**
 * DTR Billing — API vs DB cross-validation.
 *
 * Takes the first API row's meter serial and confirms it against the meter
 * lookup table (public."L_Meter_Lookup"). This also exercises the DB-pool
 * retry path (postgres.client) that observability tags as a RetryEvent.
 */
test.describe("DTR Billing — DB cross-validation", () => {
  test.describe.configure({ retries: 1, mode: "serial" });
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);
  test("DTR Billing — first row meter serial matches DB meter header",
    { tag: ["@reports", "@dtr-billing", "@db"] },
    async ({ authenticatedApi, db, obs }) => {
      const api = new DtrBillingApi(authenticatedApi);
      const query = resolveDtrBillingQuery("dev_live_primary");
      const { responseBody } = await api.getDtrBilling(query);
      const mapped = DtrBillingMapper.map(responseBody);
      const row = mapped.data.rows.find((r) => r.meterSerialNumber?.trim());
      if (!row?.meterSerialNumber?.trim()) {
        test.skip(true, "No DTR billing row with a meter serial for DB spot check");
        return;
      }
      const serial = row.meterSerialNumber.trim();
      const dbRow = await getBillingMeterHeaderBySerial(db, serial);
      if (!dbRow) {
        throw new Error(`DB meter header not found for meter serial ${serial}`);
      }
      compareApiToDb(
        [
          {
            label: "meterSerialNumber",
            apiValue: serial,
            dbValue: dbRow.meterNumber?.trim(),
          },
          {
            label: "mf",
            apiValue: row.mf,
            dbValue: dbRow.mf,
            optional: true,
          },
        ],
        "DB vs API — DTR billing meter header",
        { ...obs, table: "L_Meter_Lookup", column: "Meter_Serial_Number", mode: "exact" },
      );
    },
  );
});
