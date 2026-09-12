import { test } from "../../../fixtures/api.fixture";
import { SubstationMasterApi } from "../Api/substation-master.api";
import { substationMasterTestCases } from "../Data/substation-master.data";
import { runSubstationMasterValidation } from "./substation-master.harness";

test.describe("Master data — substation list", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(180_000);

  for (const testCase of substationMasterTestCases) {
    test(
      testCase.testName,
      { tag: testCase.tags },
      async ({ authenticatedApi }) => {
        const api = new SubstationMasterApi(authenticatedApi);
        await runSubstationMasterValidation({
          api,
          query: { ...testCase.query },
          testLabel: testCase.testName,
          searchTerm: testCase.searchTerm,
        });
      },
    );
  }
});
