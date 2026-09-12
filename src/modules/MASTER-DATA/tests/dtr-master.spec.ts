import { test } from "../../../fixtures/api.fixture";
import { DtrMasterApi } from "../Api/dtr-master.api";
import { dtrMasterTestCases } from "../Data/dtr-master.data";
import { runDtrMasterValidation } from "./dtr-master.harness";

test.describe("Master data — DTR list", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(180_000);

  for (const testCase of dtrMasterTestCases) {
    test(
      testCase.testName,
      { tag: testCase.tags },
      async ({ authenticatedApi }) => {
        const api = new DtrMasterApi(authenticatedApi);
        await runDtrMasterValidation({
          api,
          query: { ...testCase.query },
          testLabel: testCase.testName,
          searchTerm: testCase.searchTerm,
        });
      },
    );
  }
});
