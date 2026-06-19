import { test } from "../../../fixtures/api.fixture";
import { MeterMasterApi } from "../Api/meter-master.api";
import {
  masterDataDefaultQuery,
  masterDataPage2Query,
  masterDataSmallPageQuery,
} from "../Data/master-data.common.data";
import { runMeterMasterValidation } from "./meter-master.harness";

test.describe("Meter Master API", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(180_000);

  test(
    "Validate GET /indore/master-data/meter-master-data — default page",
    { tag: ["@smoke", "@master-data", "@meter-master"] },
    async ({ authenticatedApi }) => {
      const api = new MeterMasterApi(authenticatedApi);
      await runMeterMasterValidation({
        api,
        query: { ...masterDataDefaultQuery },
        testLabel: "Meter Master API",
      });
    },
  );

  test(
    "Validate pagination — page 2",
    { tag: ["@master-data", "@meter-master"] },
    async ({ authenticatedApi }) => {
      const api = new MeterMasterApi(authenticatedApi);
      await runMeterMasterValidation({
        api,
        query: { ...masterDataPage2Query },
        testLabel: "Meter Master API — Page 2",
      });
    },
  );

  test(
    "Validate pagination — smaller page size",
    { tag: ["@master-data", "@meter-master"] },
    async ({ authenticatedApi }) => {
      const api = new MeterMasterApi(authenticatedApi);
      await runMeterMasterValidation({
        api,
        query: { ...masterDataSmallPageQuery },
        testLabel: "Meter Master API — Limit 10",
      });
    },
  );

  test(
    "Validate search q — meter serial partial match",
    { tag: ["@master-data", "@meter-master"] },
    async ({ authenticatedApi }) => {
      const api = new MeterMasterApi(authenticatedApi);
      const probe = await api.getMeterMasterData({ ...masterDataDefaultQuery });
      const firstNonNullSerial = (probe.responseBody.data?.rows ?? []).find(
        (row) => row.meterSerialNumber?.trim(),
      )?.meterSerialNumber;

      if (!firstNonNullSerial) {
        test.skip(true, "No meter serial on page 1 to run search validation");
        return;
      }

      const searchTerm = firstNonNullSerial.slice(0, 6);
      await runMeterMasterValidation({
        api,
        query: { ...masterDataDefaultQuery, q: searchTerm },
        testLabel: "Meter Master API — Search",
        searchTerm,
      });
    },
  );
});
