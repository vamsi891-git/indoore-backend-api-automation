import { test } from "../../../fixtures/api.fixture";
import { FeederMasterApi } from "../Api/feeder-master.api";
import {
  masterDataDefaultQuery,
  masterDataPage2Query,
  masterDataSmallPageQuery,
} from "../Data/master-data.common.data";
import { runFeederMasterValidation } from "./feeder-master.harness";

test.describe("Feeder Master API", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(180_000);

  test(
    "Validate GET /indore/master-data/feeder-master-data — default page",
    { tag: ["@smoke", "@master-data", "@feeder-master"] },
    async ({ authenticatedApi }) => {
      const api = new FeederMasterApi(authenticatedApi);
      await runFeederMasterValidation({
        api,
        query: { ...masterDataDefaultQuery },
        testLabel: "Feeder Master API",
      });
    },
  );

  test(
    "Validate pagination — page 2",
    { tag: ["@master-data", "@feeder-master"] },
    async ({ authenticatedApi }) => {
      const api = new FeederMasterApi(authenticatedApi);
      await runFeederMasterValidation({
        api,
        query: { ...masterDataPage2Query },
        testLabel: "Feeder Master API — Page 2",
      });
    },
  );

  test(
    "Validate pagination — smaller page size",
    { tag: ["@master-data", "@feeder-master"] },
    async ({ authenticatedApi }) => {
      const api = new FeederMasterApi(authenticatedApi);
      await runFeederMasterValidation({
        api,
        query: { ...masterDataSmallPageQuery },
        testLabel: "Feeder Master API — Limit 10",
      });
    },
  );

  test(
    "Validate search q — feeder name partial match",
    { tag: ["@master-data", "@feeder-master"] },
    async ({ authenticatedApi }) => {
      const api = new FeederMasterApi(authenticatedApi);
      const probe = await api.getFeederMasterData({ ...masterDataDefaultQuery });
      const feederName = (probe.responseBody.data?.rows ?? [])[0]?.feederName?.trim();

      if (!feederName) {
        test.skip(true, "No feeder name on page 1");
        return;
      }

      const searchTerm = feederName.slice(0, Math.min(6, feederName.length));
      await runFeederMasterValidation({
        api,
        query: { ...masterDataDefaultQuery, q: searchTerm },
        testLabel: "Feeder Master API — Search",
        searchTerm,
      });
    },
  );
});
