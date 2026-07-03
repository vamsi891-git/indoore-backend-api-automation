import { test } from "../../../../src/fixtures/api.fixture";
import { NetworkHierarchyApi } from "../Api/networkhierarchy.api";
import { runNetworkHierarchyValidation } from "./network-hierarchy.harness";

test.describe("Network Hierarchy API", () => {
  test(
    "Validate Network Hierarchy API",
    { tag: ["@smoke", "@hierarchy", "@asset-management"] },
    async ({ authenticatedApi }) => {
      const api = new NetworkHierarchyApi(authenticatedApi);
      await runNetworkHierarchyValidation({
        api,
        testLabel: "Network Hierarchy API",
      });
    },
  );
});
