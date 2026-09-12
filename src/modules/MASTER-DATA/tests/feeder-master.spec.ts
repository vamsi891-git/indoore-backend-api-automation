import { test } from "../../../fixtures/api.fixture";
import { FeederMasterApi } from "../Api/feeder-master.api";
import { feederMasterTestCases } from "../Data/feeder-master.data";
import { runFeederMasterValidation } from "./feeder-master.harness";

test.describe("Master data — feeder list", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(180_000);

  for (const testCase of feederMasterTestCases) {
    test(
      testCase.testName,
      { tag: testCase.tags },
      async ({ authenticatedApi }) => {
        const api = new FeederMasterApi(authenticatedApi);
        await runFeederMasterValidation({
          api,
          query: { ...testCase.query },
          testLabel: testCase.testName,
          searchTerm: testCase.searchTerm,
        });
      },
    );
  }
});
