import { test } from "../../../fixtures/api.fixture";
import { DtrMasterApi } from "../Api/dtr-master.api";
import {
  masterDataDefaultQuery,
  masterDataPage2Query,
  masterDataSmallPageQuery,
} from "../Data/master-data.common.data";
import { runDtrMasterValidation } from "./dtr-master.harness";

test.describe("DTR Master API", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(180_000);

  test(
    "Validate GET /indore/master-data/dtr-master-data — default page",
    { tag: ["@smoke", "@master-data", "@dtr-master"] },
    async ({ authenticatedApi }) => {
      const api = new DtrMasterApi(authenticatedApi);
      await runDtrMasterValidation({
        api,
        query: { ...masterDataDefaultQuery },
        testLabel: "DTR Master API",
      });
    },
  );

  test(
    "Validate pagination — page 2",
    { tag: ["@master-data", "@dtr-master"] },
    async ({ authenticatedApi }) => {
      const api = new DtrMasterApi(authenticatedApi);
      await runDtrMasterValidation({
        api,
        query: { ...masterDataPage2Query },
        testLabel: "DTR Master API — Page 2",
      });
    },
  );

  test(
    "Validate pagination — smaller page size",
    { tag: ["@master-data", "@dtr-master"] },
    async ({ authenticatedApi }) => {
      const api = new DtrMasterApi(authenticatedApi);
      await runDtrMasterValidation({
        api,
        query: { ...masterDataSmallPageQuery },
        testLabel: "DTR Master API — Limit 10",
      });
    },
  );

  test(
    "Validate search q — DTR or meter serial partial match",
    { tag: ["@master-data", "@dtr-master"] },
    async ({ authenticatedApi }) => {
      const api = new DtrMasterApi(authenticatedApi);
      const probe = await api.getDtrMasterData({ ...masterDataDefaultQuery });
      const firstRow = (probe.responseBody.data?.rows ?? [])[0];
      const searchSource =
        firstRow?.dtr?.trim() || firstRow?.meterSerialNumber?.trim();

      if (!searchSource) {
        test.skip(true, "No searchable DTR field on page 1");
        return;
      }

      const searchTerm = searchSource.slice(0, Math.min(6, searchSource.length));
      await runDtrMasterValidation({
        api,
        query: { ...masterDataDefaultQuery, q: searchTerm },
        testLabel: "DTR Master API — Search",
        searchTerm,
      });
    },
  );
});
