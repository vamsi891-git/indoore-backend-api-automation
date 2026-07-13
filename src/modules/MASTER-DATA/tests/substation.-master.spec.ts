import { test } from "../../../fixtures/api.fixture";
import { SubstationMasterApi } from "../Api/substation-master.api";
import {
  masterDataDefaultQuery,
  masterDataPage2Query,
  masterDataSmallPageQuery,
} from "../Data/master-data.common.data";
import { runSubstationMasterValidation } from "./substation-master.harness";

test.describe("Substation Master API", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(180_000);

  test(
    "Validate substation master data — default page",
    { tag: ["@smoke", "@master-data", "@substation-master"] },
    async ({ authenticatedApi }) => {
      const api = new SubstationMasterApi(authenticatedApi);
      await runSubstationMasterValidation({
        api,
        query: { ...masterDataDefaultQuery },
        testLabel: "Substation Master API",
      });
    },
  );

  test(
    "Validate pagination — page 2",
    { tag: ["@master-data", "@substation-master"] },
    async ({ authenticatedApi }) => {
      const api = new SubstationMasterApi(authenticatedApi);
      await runSubstationMasterValidation({
        api,
        query: { ...masterDataPage2Query },
        testLabel: "Substation Master API — Page 2",
      });
    },
  );

  test(
    "Validate pagination — smaller page size",
    { tag: ["@master-data", "@substation-master"] },
    async ({ authenticatedApi }) => {
      const api = new SubstationMasterApi(authenticatedApi);
      await runSubstationMasterValidation({
        api,
        query: { ...masterDataSmallPageQuery },
        testLabel: "Substation Master API — Limit 10",
      });
    },
  );

  test(
    "Validate search q — substation name partial match",
    { tag: ["@master-data", "@substation-master"] },
    async ({ authenticatedApi }) => {
      const api = new SubstationMasterApi(authenticatedApi);
      const probe = await api.getSubstationMasterData({ ...masterDataDefaultQuery });
      const substationName = (probe.responseBody.data?.rows ?? [])[0]?.substationName?.trim();

      if (!substationName) {
        test.skip(true, "No substation name on page 1");
        return;
      }

      const searchTerm = substationName.slice(0, Math.min(6, substationName.length));
      await runSubstationMasterValidation({
        api,
        query: { ...masterDataDefaultQuery, q: searchTerm },
        testLabel: "Substation Master API — Search",
        searchTerm,
      });
    },
  );
});
