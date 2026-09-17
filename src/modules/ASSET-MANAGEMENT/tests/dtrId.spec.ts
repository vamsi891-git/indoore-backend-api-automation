import { test } from "../../../../src/fixtures/api.fixture";
import { DtrDetailApi } from "../Api/DtrId.api";
import { DtrDetailTestData } from "../Data/DtrId.data";
import { resolveLiveDtrLookupId } from "../utils/resolve-dtr-lookup.helper";
import { runDtrDetailValidation } from "./dtr-detail.harness";

test.describe("DTR Detail API", () => {
  test(
    "Validate DTR Detail API",
    { tag: ["@smoke", "@dtr", "@asset-management"] },
    async ({ authenticatedApi }) => {
      const dtrId = await resolveLiveDtrLookupId(authenticatedApi);
      test.skip(
        dtrId == null,
        "No DTR in network hierarchy (configured ASSET_DTR_LOOKUP_ID was not found)",
      );
      const api = new DtrDetailApi(authenticatedApi);
      await runDtrDetailValidation({
        api,
        dtrId: dtrId as number,
        page: DtrDetailTestData.page,
        limit: DtrDetailTestData.limit,
        testLabel: "DTR Detail API",
      });
    },
  );
});
