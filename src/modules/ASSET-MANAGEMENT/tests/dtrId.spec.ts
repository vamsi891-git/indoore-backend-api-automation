import { test } from "../../../../src/fixtures/api.fixture";
import { DtrDetailApi } from "../Api/DtrId.api";
import { DtrDetailTestData } from "../Data/DtrId.data";
import { runDtrDetailValidation } from "./dtr-detail.harness";

test.describe("DTR Detail API", () => {
  test(
    "Validate DTR Detail API",
    { tag: ["@smoke", "@dtr", "@asset-management"] },
    async ({ authenticatedApi }) => {
      const api = new DtrDetailApi(authenticatedApi);
      await runDtrDetailValidation({
        api,
        dtrId: DtrDetailTestData.dtrId,
        page: DtrDetailTestData.page,
        limit: DtrDetailTestData.limit,
        testLabel: "DTR Detail API",
      });
    },
  );
});
